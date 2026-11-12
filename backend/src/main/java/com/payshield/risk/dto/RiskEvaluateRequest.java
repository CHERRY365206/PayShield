package com.payshield.risk.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RiskEvaluateRequest(
    @NotNull @Min(100) Long amount,
    String simulatedLocation
) {}
