package com.payshield.payment.dto;

import java.util.UUID;

public record CreateOrderResponse(
    UUID transactionId,
    String razorpayOrderId,
    Long amount,
    String currency,
    String razorpayKeyId,
    String status,
    String riskDecision,
    Integer riskScore,
    String riskExplanation
) {}
