package com.payshield.payment.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.payshield.audit.service.AuditService;
import com.payshield.auth.entity.User;
import com.payshield.auth.repository.UserRepository;
import com.payshield.common.exception.PaymentException;
import com.payshield.common.exception.ResourceNotFoundException;
import com.payshield.gateway.service.RazorpayGatewayService;
import com.payshield.idempotency.entity.IdempotencyRecord;
import com.payshield.idempotency.service.IdempotencyService;
import com.payshield.payment.dto.*;
import com.payshield.payment.entity.Transaction;
import com.payshield.payment.repository.TransactionRepository;
import com.payshield.refund.entity.Refund;
import com.payshield.refund.repository.RefundRepository;
import com.payshield.risk.dto.RiskResult;
import com.payshield.risk.engine.RiskAssessmentEngine;
import com.payshield.risk.entity.RiskAssessment;
import com.payshield.risk.repository.RiskAssessmentRepository;
import com.razorpay.Order;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final RiskAssessmentEngine riskEngine;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final RazorpayGatewayService gatewayService;
    private final IdempotencyService idempotencyService;
    private final RefundRepository refundRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Value("${razorpay.key-id}")
    private String razorpayKeyId;

    @Transactional
    public CreateOrderResponse createOrder(UUID userId, CreateOrderRequest request, String idempotencyKey) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String requestHash = idempotencyKey != null
            ? idempotencyService.computeHash(userId + ":" + request.amount() + ":" + request.description())
            : null;

        if (idempotencyKey != null) {
            Optional<IdempotencyRecord> existing = idempotencyService.findByKey(idempotencyKey);
            if (existing.isPresent()) {
                idempotencyService.checkConflict(existing.get(), requestHash);
                try {
                    return objectMapper.readValue(existing.get().getResponseBody(), CreateOrderResponse.class);
                } catch (JsonProcessingException e) {
                    throw new PaymentException("Failed to deserialize cached response");
                }
            }
        }

        Transaction transaction = Transaction.builder()
            .user(user)
            .amount(request.amount())
            .currency("INR")
            .description(request.description())
            .simulatedLocation(request.simulatedLocation())
            .status(Transaction.TransactionStatus.RISK_EVALUATION)
            .idempotencyKey(idempotencyKey)
            .build();
        transaction = transactionRepository.save(transaction);

        RiskResult riskResult = riskEngine.evaluate(userId, request.amount(), request.simulatedLocation());

        RiskAssessment assessment = RiskAssessment.builder()
            .transaction(transaction)
            .user(user)
            .riskScore(riskResult.riskScore())
            .decision(riskResult.decision())
            .amountScore(riskResult.amountScore())
            .velocityScore(riskResult.velocityScore())
            .failureScore(riskResult.failureScore())
            .geographicScore(riskResult.geographicScore())
            .reasons(riskResult.reasons())
            .build();
        riskAssessmentRepository.save(assessment);

        transaction.setRiskScore(riskResult.riskScore());
        transaction.setRiskDecision(riskResult.decision());
        transaction.setRiskExplanation(String.join("; ", riskResult.reasons()));

        CreateOrderResponse response;

        if ("DECLINED".equals(riskResult.decision())) {
            transaction.setStatus(Transaction.TransactionStatus.REJECTED);
            transactionRepository.save(transaction);
            auditService.log(userId, "PAYMENT_DECLINED", "TRANSACTION", transaction.getId(),
                "Risk score: " + riskResult.riskScore(), null);
            response = new CreateOrderResponse(
                transaction.getId(), null, request.amount(), "INR",
                null, "REJECTED", "DECLINED", riskResult.riskScore(),
                String.join("; ", riskResult.reasons())
            );
        } else if ("REVIEW_REQUIRED".equals(riskResult.decision())) {
            transaction.setStatus(Transaction.TransactionStatus.PENDING_REVIEW);
            transactionRepository.save(transaction);
            auditService.log(userId, "PAYMENT_PENDING_REVIEW", "TRANSACTION", transaction.getId(),
                "Risk score: " + riskResult.riskScore(), null);
            response = new CreateOrderResponse(
                transaction.getId(), null, request.amount(), "INR",
                null, "PENDING_REVIEW", "REVIEW_REQUIRED", riskResult.riskScore(),
                String.join("; ", riskResult.reasons())
            );
        } else {
            Order razorpayOrder = gatewayService.createOrder(request.amount(), "INR",
                "pay_" + transaction.getId().toString().substring(0, 8));
            String razorpayOrderId = razorpayOrder.get("id");

            transaction.setRazorpayOrderId(razorpayOrderId);
            transaction.setStatus(Transaction.TransactionStatus.ORDER_CREATED);
            transactionRepository.save(transaction);

            auditService.log(userId, "PAYMENT_ORDER_CREATED", "TRANSACTION", transaction.getId(),
                "Order: " + razorpayOrderId, null);

            response = new CreateOrderResponse(
                transaction.getId(), razorpayOrderId, request.amount(), "INR",
                razorpayKeyId, "ORDER_CREATED", "APPROVED", riskResult.riskScore(),
                riskResult.reasons().isEmpty() ? "Transaction approved" : String.join("; ", riskResult.reasons())
            );
        }

        if (idempotencyKey != null) {
            try {
                String responseBody = objectMapper.writeValueAsString(response);
                idempotencyService.store(idempotencyKey, requestHash, 200, responseBody, transaction.getId());
            } catch (JsonProcessingException e) {
                log.warn("Could not serialize response for idempotency store: {}", e.getMessage());
            }
        }

        return response;
    }

    @Transactional
    public TransactionDTO verifyPayment(VerifyPaymentRequest request) {
        Transaction transaction = transactionRepository.findByRazorpayOrderId(request.razorpayOrderId())
            .orElseThrow(() -> new ResourceNotFoundException("Transaction not found for order: " + request.razorpayOrderId()));

        if (transaction.getStatus() == Transaction.TransactionStatus.VERIFIED
            || transaction.getStatus() == Transaction.TransactionStatus.CAPTURED) {
            return TransactionDTO.from(transaction);
        }

        boolean isValid = gatewayService.verifyPaymentSignature(
            request.razorpayOrderId(), request.razorpayPaymentId(), request.razorpaySignature());

        if (!isValid) {
            transaction.setStatus(Transaction.TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            auditService.log(transaction.getUser().getId(), "PAYMENT_VERIFICATION_FAILED",
                "TRANSACTION", transaction.getId(), "Invalid signature", null);
            throw new PaymentException("Payment signature verification failed");
        }

        transaction.setRazorpayPaymentId(request.razorpayPaymentId());
        transaction.setStatus(Transaction.TransactionStatus.CAPTURED);
        transaction.setPaymentMethod("UPI");
        transactionRepository.save(transaction);

        auditService.log(transaction.getUser().getId(), "PAYMENT_VERIFIED",
            "TRANSACTION", transaction.getId(), "Payment: " + request.razorpayPaymentId(), null);

        return TransactionDTO.from(transaction);
    }

    public Page<TransactionDTO> getTransactions(UUID userId, Pageable pageable) {
        return transactionRepository.findByUserId(userId, pageable).map(TransactionDTO::from);
    }

    public TransactionDTO getTransaction(UUID userId, UUID transactionId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        return TransactionDTO.from(transaction);
    }

    @Transactional
    public Refund refund(UUID userId, UUID transactionId, RefundRequest request) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        if (transaction.getStatus() != Transaction.TransactionStatus.CAPTURED
            && transaction.getStatus() != Transaction.TransactionStatus.VERIFIED) {
            throw new PaymentException("Only captured transactions can be refunded. Current status: " + transaction.getStatus());
        }

        if (refundRepository.existsByTransactionIdAndStatus(transactionId, "COMPLETED")) {
            throw new PaymentException("Transaction has already been refunded");
        }

        if (request.amount() > transaction.getAmount()) {
            throw new PaymentException("Refund amount cannot exceed transaction amount");
        }

        boolean isSimulated = false;
        String razorpayRefundId = null;
        String gatewayResponse = null;

        if (transaction.getRazorpayPaymentId() != null) {
            org.json.JSONObject refundResult = gatewayService.initiateRefund(
                transaction.getRazorpayPaymentId(), request.amount());
            if (refundResult != null) {
                razorpayRefundId = refundResult.optString("id");
                gatewayResponse = refundResult.toString();
            } else {
                isSimulated = true;
                razorpayRefundId = "sim_" + UUID.randomUUID().toString().substring(0, 8);
                log.info("Using simulated refund for transaction {}", transactionId);
            }
        } else {
            isSimulated = true;
            razorpayRefundId = "sim_" + UUID.randomUUID().toString().substring(0, 8);
        }

        Refund refund = Refund.builder()
            .transaction(transaction)
            .razorpayRefundId(razorpayRefundId)
            .amount(request.amount())
            .status("COMPLETED")
            .reason(request.reason())
            .isSimulated(isSimulated)
            .gatewayResponse(gatewayResponse)
            .build();

        refund = refundRepository.save(refund);

        transaction.setStatus(Transaction.TransactionStatus.REFUNDED);
        transactionRepository.save(transaction);

        auditService.log(userId, "REFUND_INITIATED", "TRANSACTION", transactionId,
            "Refund: " + razorpayRefundId + (isSimulated ? " (simulated)" : ""), null);

        return refund;
    }
}
