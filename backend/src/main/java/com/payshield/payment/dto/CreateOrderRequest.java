package com.payshield.payment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateOrderRequest(
    @NotNull(message = "Amount is required")
    @Min(value = 100, message = "Minimum amount is ₹1 (100 paise)")
    Long amount, // in paise

    @Size(max = 500, message = "Description must be under 500 characters")
    String description,

    String simulatedLocation
) {}
