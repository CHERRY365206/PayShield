package com.payshield.payment.entity;

import com.payshield.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "razorpay_order_id")
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id")
    private String razorpayPaymentId;

    @Column(nullable = false)
    private Long amount; // in paise (minor units)

    @Builder.Default
    @Column(nullable = false, length = 10)
    private String currency = "INR";

    private String description;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TransactionStatus status = TransactionStatus.CREATED;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Column(name = "risk_decision", length = 30)
    private String riskDecision;

    @Column(name = "risk_explanation")
    private String riskExplanation;

    @Column(name = "idempotency_key")
    private String idempotencyKey;

    @Column(name = "simulated_location")
    private String simulatedLocation;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "gateway_response", columnDefinition = "jsonb")
    private String gatewayResponse;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public BigDecimal getAmountInRupees() {
        return BigDecimal.valueOf(amount).movePointLeft(2);
    }

    public enum TransactionStatus {
        CREATED, RISK_EVALUATION, ORDER_CREATED, CHECKOUT,
        SUCCESS, FAILED, CANCELLED, VERIFIED, CAPTURED, REJECTED, PENDING_REVIEW, REFUNDED
    }
}
