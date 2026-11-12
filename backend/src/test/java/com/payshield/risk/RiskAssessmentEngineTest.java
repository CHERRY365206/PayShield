package com.payshield.risk;

import com.payshield.payment.entity.Transaction;
import com.payshield.payment.repository.TransactionRepository;
import com.payshield.risk.dto.RiskResult;
import com.payshield.risk.engine.RiskAssessmentEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RiskAssessmentEngineTest {

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private RiskAssessmentEngine riskEngine;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        ReflectionTestUtils.setField(riskEngine, "approvedMax", 29);
        ReflectionTestUtils.setField(riskEngine, "reviewMax", 59);
        ReflectionTestUtils.setField(riskEngine, "elevatedAmountThreshold", 500000L);
        ReflectionTestUtils.setField(riskEngine, "highAmountThreshold", 2000000L);
        ReflectionTestUtils.setField(riskEngine, "maxTransactionsPerMinute", 3);
        ReflectionTestUtils.setField(riskEngine, "maxTransactionsPerFiveMinutes", 5);
        ReflectionTestUtils.setField(riskEngine, "amountAnomalyWeight", 25);
        ReflectionTestUtils.setField(riskEngine, "velocityWeight", 30);
        ReflectionTestUtils.setField(riskEngine, "repeatedFailuresWeight", 20);
        ReflectionTestUtils.setField(riskEngine, "geographicAnomalyWeight", 25);

        lenient().when(transactionRepository.countByUserIdAndCreatedAtAfter(any(), any())).thenReturn(0L);
        lenient().when(transactionRepository.countByUserIdAndStatusAndCreatedAtAfter(any(), any(), any())).thenReturn(0L);
        lenient().when(transactionRepository.findTop5ByUserIdOrderByCreatedAtDesc(any())).thenReturn(List.of());
    }

    @Test
    void lowAmountTransactionShouldBeApproved() {
        RiskResult result = riskEngine.evaluate(userId, 100000L, null); // ₹1,000
        assertThat(result.decision()).isEqualTo("APPROVED");
        assertThat(result.riskScore()).isLessThanOrEqualTo(29);
        assertThat(result.amountScore()).isZero();
    }

    @Test
    void highAmountTransactionShouldTriggerHighAmountRisk() {
        RiskResult result = riskEngine.evaluate(userId, 3000000L, null); // ₹30,000
        assertThat(result.amountScore()).isEqualTo(25);
        assertThat(result.reasons()).anyMatch(r -> r.contains("high-risk threshold"));
    }

    @Test
    void elevatedAmountShouldIncreaseRisk() {
        RiskResult result = riskEngine.evaluate(userId, 1000000L, null); // ₹10,000
        assertThat(result.amountScore()).isEqualTo(12);
    }

    @Test
    void highVelocityShouldIncreaseRisk() {
        when(transactionRepository.countByUserIdAndCreatedAtAfter(eq(userId), any())).thenReturn(5L);
        RiskResult result = riskEngine.evaluate(userId, 10000L, null);
        assertThat(result.velocityScore()).isEqualTo(30);
        assertThat(result.reasons()).anyMatch(r -> r.contains("velocity"));
    }

    @Test
    void multipleFailuresShouldIncreaseRisk() {
        when(transactionRepository.countByUserIdAndStatusAndCreatedAtAfter(
            eq(userId), eq(Transaction.TransactionStatus.FAILED), any())).thenReturn(3L);
        RiskResult result = riskEngine.evaluate(userId, 10000L, null);
        assertThat(result.failureScore()).isEqualTo(20);
    }

    @Test
    void geographicAnomalyShouldIncreaseRisk() {
        Transaction previousTx = new Transaction();
        previousTx.setSimulatedLocation("Mumbai");
        when(transactionRepository.findTop5ByUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(previousTx));

        RiskResult result = riskEngine.evaluate(userId, 10000L, "Delhi");
        assertThat(result.geographicScore()).isEqualTo(25);
    }

    @Test
    void combinedHighRiskShouldBeDeclined() {
        // Amount (25) + Velocity (30) + Failures (20) = 75 (> 59 -> DECLINED)
        when(transactionRepository.countByUserIdAndCreatedAtAfter(any(), any())).thenReturn(5L);
        when(transactionRepository.countByUserIdAndStatusAndCreatedAtAfter(any(), any(), any())).thenReturn(3L);
        RiskResult result = riskEngine.evaluate(userId, 3000000L, null);
        assertThat(result.decision()).isEqualTo("DECLINED");
        assertThat(result.riskScore()).isGreaterThanOrEqualTo(60);
    }

    @Test
    void riskScoreShouldBeClamped() {
        when(transactionRepository.countByUserIdAndCreatedAtAfter(any(), any())).thenReturn(10L);
        when(transactionRepository.countByUserIdAndStatusAndCreatedAtAfter(any(), any(), any())).thenReturn(5L);
        Transaction previousTx = new Transaction();
        previousTx.setSimulatedLocation("Mumbai");
        when(transactionRepository.findTop5ByUserIdOrderByCreatedAtDesc(any())).thenReturn(List.of(previousTx));

        RiskResult result = riskEngine.evaluate(userId, 3000000L, "Delhi");
        assertThat(result.riskScore()).isLessThanOrEqualTo(100);
    }
}
