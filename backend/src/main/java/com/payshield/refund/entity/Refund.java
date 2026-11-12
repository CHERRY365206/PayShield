package com.payshield.refund.entity;

import com.payshield.payment.entity.Transaction;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refunds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Refund {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;

    @Column(name = "razorpay_refund_id")
    private String razorpayRefundId;

    @Column(nullable = false)
    private Long amount;

    @Builder.Default
    @Column(nullable = false, length = 50)
    private String status = "INITIATED";

    private String reason;

    @Builder.Default
    @Column(name = "is_simulated", nullable = false)
    private boolean isSimulated = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "gateway_response")
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
}
