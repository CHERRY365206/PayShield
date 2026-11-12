package com.payshield.payment.dto;

import com.payshield.payment.entity.Transaction;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TransactionDTO(
    UUID id,
    UUID userId,
    String userEmail,
    String razorpayOrderId,
    String razorpayPaymentId,
    Long amount,
    BigDecimal amountInRupees,
    String currency,
    String description,
    String paymentMethod,
    String status,
    Integer riskScore,
    String riskDecision,
    String riskExplanation,
    String simulatedLocation,
    Instant createdAt,
    Instant updatedAt
) {
    public static TransactionDTO from(Transaction t) {
        return new TransactionDTO(
            t.getId(),
            t.getUser().getId(),
            t.getUser().getEmail(),
            t.getRazorpayOrderId(),
            t.getRazorpayPaymentId(),
            t.getAmount(),
            t.getAmountInRupees(),
            t.getCurrency(),
            t.getDescription(),
            t.getPaymentMethod(),
            t.getStatus().name(),
            t.getRiskScore(),
            t.getRiskDecision(),
            t.getRiskExplanation(),
            t.getSimulatedLocation(),
            t.getCreatedAt(),
            t.getUpdatedAt()
        );
    }
}
