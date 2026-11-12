package com.payshield.risk.entity;

import com.payshield.payment.entity.Transaction;
import com.payshield.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "risk_assessments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "risk_score", nullable = false)
    private int riskScore;

    @Column(nullable = false, length = 30)
    private String decision;

    @Column(name = "amount_score", nullable = false)
    private int amountScore;

    @Column(name = "velocity_score", nullable = false)
    private int velocityScore;

    @Column(name = "failure_score", nullable = false)
    private int failureScore;

    @Column(name = "geographic_score", nullable = false)
    private int geographicScore;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]")
    private List<String> reasons;

    @Column(name = "evaluated_at", nullable = false)
    private Instant evaluatedAt;

    @PrePersist
    protected void onCreate() {
        evaluatedAt = Instant.now();
    }
}
