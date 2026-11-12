package com.payshield.webhook.service;

import com.payshield.payment.entity.Transaction;
import com.payshield.payment.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {

    private final TransactionRepository transactionRepository;

    @Transactional
    public void processPaymentCaptured(JSONObject payload) {
        try {
            JSONObject paymentEntity = payload.getJSONObject("payload")
                .getJSONObject("payment").getJSONObject("entity");
            String orderId = paymentEntity.getString("order_id");
            String paymentId = paymentEntity.getString("id");

            Optional<Transaction> txOpt = transactionRepository.findByRazorpayOrderId(orderId);
            txOpt.ifPresent(tx -> {
                if (tx.getStatus() != Transaction.TransactionStatus.CAPTURED) {
                    tx.setRazorpayPaymentId(paymentId);
                    tx.setStatus(Transaction.TransactionStatus.CAPTURED);
                    transactionRepository.save(tx);
                    log.info("Payment captured via webhook: {} for order {}", paymentId, orderId);
                }
            });
        } catch (Exception e) {
            log.error("Error processing payment.captured webhook: {}", e.getMessage());
        }
    }

    @Transactional
    public void processPaymentFailed(JSONObject payload) {
        try {
            JSONObject paymentEntity = payload.getJSONObject("payload")
                .getJSONObject("payment").getJSONObject("entity");
            String orderId = paymentEntity.optString("order_id");

            if (orderId != null && !orderId.isBlank()) {
                transactionRepository.findByRazorpayOrderId(orderId).ifPresent(tx -> {
                    if (tx.getStatus() == Transaction.TransactionStatus.ORDER_CREATED
                        || tx.getStatus() == Transaction.TransactionStatus.CHECKOUT) {
                        tx.setStatus(Transaction.TransactionStatus.FAILED);
                        transactionRepository.save(tx);
                        log.info("Payment failed via webhook for order {}", orderId);
                    }
                });
            }
        } catch (Exception e) {
            log.error("Error processing payment.failed webhook: {}", e.getMessage());
        }
    }

    public void processRefundProcessed(JSONObject payload) {
        log.info("Refund processed webhook received: {}", payload);
    }
}

