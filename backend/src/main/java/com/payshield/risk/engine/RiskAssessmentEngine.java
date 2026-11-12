package com.payshield.risk.engine;

import com.payshield.payment.entity.Transaction;
import com.payshield.payment.repository.TransactionRepository;
import com.payshield.risk.dto.RiskResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class RiskAssessmentEngine {

    private final TransactionRepository transactionRepository;

    @Value("${app.risk.thresholds.approved-max:29}")
    private int approvedMax;

    @Value("${app.risk.thresholds.review-max:59}")
    private int reviewMax;

    @Value("${app.risk.amount.elevated-threshold:500000}")
    private long elevatedAmountThreshold; // 5000 INR in paise

    @Value("${app.risk.amount.high-threshold:2000000}")
    private long highAmountThreshold; // 20000 INR in paise

    @Value("${app.risk.velocity.max-transactions-per-minute:3}")
    private int maxTransactionsPerMinute;

    @Value("${app.risk.velocity.max-transactions-per-five-minutes:5}")
    private int maxTransactionsPerFiveMinutes;

    @Value("${app.risk.weights.amount-anomaly:25}")
    private int amountAnomalyWeight;

    @Value("${app.risk.weights.velocity:30}")
    private int velocityWeight;

    @Value("${app.risk.weights.repeated-failures:20}")
    private int repeatedFailuresWeight;

    @Value("${app.risk.weights.geographic-anomaly:25}")
    private int geographicAnomalyWeight;

    public RiskResult evaluate(UUID userId, long amountInPaise, String simulatedLocation) {
        List<String> reasons = new ArrayList<>();
        int amountScore = evaluateAmount(amountInPaise, reasons);
        int velocityScore = evaluateVelocity(userId, reasons);
        int failureScore = evaluateFailures(userId, reasons);
        int geoScore = evaluateGeographic(userId, simulatedLocation, reasons);

        int total = Math.min(100, amountScore + velocityScore + failureScore + geoScore);
        String decision;
        if (total <= approvedMax) {
            decision = "APPROVED";
        } else if (total <= reviewMax) {
            decision = "REVIEW_REQUIRED";
        } else {
            decision = "DECLINED";
        }

        log.info("Risk evaluation for user {}: score={}, decision={}", userId, total, decision);
        return new RiskResult(total, decision, amountScore, velocityScore, failureScore, geoScore, reasons);
    }

    private int evaluateAmount(long amountInPaise, List<String> reasons) {
        if (amountInPaise > highAmountThreshold) {
            reasons.add("Transaction amount (₹" + amountInPaise / 100 + ") exceeds high-risk threshold of ₹20,000");
            return amountAnomalyWeight;
        } else if (amountInPaise > elevatedAmountThreshold) {
            reasons.add("Transaction amount (₹" + amountInPaise / 100 + ") exceeds elevated threshold of ₹5,000");
            return amountAnomalyWeight / 2;
        }
        return 0;
    }

    private int evaluateVelocity(UUID userId, List<String> reasons) {
        Instant oneMinuteAgo = Instant.now().minus(1, ChronoUnit.MINUTES);
        Instant fiveMinutesAgo = Instant.now().minus(5, ChronoUnit.MINUTES);

        long txInLastMinute = transactionRepository.countByUserIdAndCreatedAtAfter(userId, oneMinuteAgo);
        long txInLastFiveMinutes = transactionRepository.countByUserIdAndCreatedAtAfter(userId, fiveMinutesAgo);

        if (txInLastMinute >= maxTransactionsPerMinute || txInLastFiveMinutes >= maxTransactionsPerFiveMinutes) {
            reasons.add("High transaction velocity: " + txInLastMinute + " transactions in last minute, "
                + txInLastFiveMinutes + " in last 5 minutes");
            return velocityWeight;
        }
        return 0;
    }

    private int evaluateFailures(UUID userId, List<String> reasons) {
        Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
        long recentFailures = transactionRepository.countByUserIdAndStatusAndCreatedAtAfter(
            userId, Transaction.TransactionStatus.FAILED, oneHourAgo);

        if (recentFailures >= 3) {
            reasons.add("Multiple recent payment failures: " + recentFailures + " failed transactions in last hour");
            return repeatedFailuresWeight;
        } else if (recentFailures >= 1) {
            reasons.add("Recent payment failure detected");
            return repeatedFailuresWeight / 2;
        }
        return 0;
    }

    private int evaluateGeographic(UUID userId, String simulatedLocation, List<String> reasons) {
        if (simulatedLocation == null || simulatedLocation.isBlank()) {
            return 0;
        }
        List<Transaction> recentTx = transactionRepository.findTop5ByUserIdOrderByCreatedAtDesc(userId);
        if (recentTx.isEmpty()) {
            return 0;
        }
        boolean locationMismatch = recentTx.stream()
            .filter(t -> t.getSimulatedLocation() != null && !t.getSimulatedLocation().isBlank())
            .anyMatch(t -> !t.getSimulatedLocation().equalsIgnoreCase(simulatedLocation));

        if (locationMismatch) {
            reasons.add("Transaction location (" + simulatedLocation + ") differs from recent activity locations");
            return geographicAnomalyWeight;
        }
        return 0;
    }
}
