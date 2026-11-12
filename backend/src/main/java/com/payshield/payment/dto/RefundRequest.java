package com.payshield.payment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RefundRequest(
    @NotNull(message = "Refund amount is required")
    @Min(value = 100, message = "Minimum refund amount is ₹1 (100 paise)")
    Long amount,

    String reason
) {}
