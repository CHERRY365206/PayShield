package com.payshield.admin.dto;

public record DashboardStats(
    long totalTransactions,
    long successfulTransactions,
    long failedTransactions,
    long pendingTransactions,
    long flaggedTransactions,
    long declinedTransactions,
    long totalVolumeInPaise,
    double successRate,
    RiskDistribution riskDistribution
) {
    public record RiskDistribution(
        long approved,
        long reviewRequired,
        long declined
    ) {}
}

