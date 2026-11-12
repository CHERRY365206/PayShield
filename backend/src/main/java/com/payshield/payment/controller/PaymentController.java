package com.payshield.payment.controller;

import com.payshield.auth.entity.User;
import com.payshield.common.dto.ApiResponse;
import com.payshield.payment.dto.*;
import com.payshield.payment.service.PaymentService;
import com.payshield.refund.entity.Refund;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Payments", description = "Payment management endpoints")
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentService paymentService;

    @Operation(summary = "Create a payment order")
    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<CreateOrderResponse>> createOrder(
        @AuthenticationPrincipal User user,
        @Valid @RequestBody CreateOrderRequest request,
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        CreateOrderResponse response = paymentService.createOrder(user.getId(), request, idempotencyKey);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Verify a payment after checkout")
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<TransactionDTO>> verifyPayment(
        @Valid @RequestBody VerifyPaymentRequest request
    ) {
        TransactionDTO transaction = paymentService.verifyPayment(request);
        return ResponseEntity.ok(ApiResponse.success(transaction, "Payment verified successfully"));
    }

    @Operation(summary = "Get payment history")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<TransactionDTO>>> getTransactions(
        @AuthenticationPrincipal User user,
        Pageable pageable
    ) {
        Page<TransactionDTO> transactions = paymentService.getTransactions(user.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(transactions));
    }

    @Operation(summary = "Get transaction details")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionDTO>> getTransaction(
        @AuthenticationPrincipal User user,
        @PathVariable UUID id
    ) {
        TransactionDTO transaction = paymentService.getTransaction(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(transaction));
    }

    @Operation(summary = "Initiate a refund")
    @PostMapping("/{id}/refund")
    public ResponseEntity<ApiResponse<Refund>> refund(
        @AuthenticationPrincipal User user,
        @PathVariable UUID id,
        @Valid @RequestBody RefundRequest request
    ) {
        Refund refund = paymentService.refund(user.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success(refund, "Refund initiated successfully"));
    }
}
