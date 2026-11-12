package com.payshield.risk.dto;

import java.util.List;

public record RiskResult(
    int riskScore,
    String decision,
    int amountScore,
    int velocityScore,
    int failureScore,
    int geographicScore,
    List<String> reasons
) {}
