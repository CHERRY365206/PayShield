package com.payshield.payment.repository;

import com.payshield.payment.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    Page<Transaction> findByUserId(UUID userId, Pageable pageable);
    Optional<Transaction> findByRazorpayOrderId(String razorpayOrderId);
    Optional<Transaction> findByIdAndUserId(UUID id, UUID userId);
    long countByUserIdAndCreatedAtAfter(UUID userId, Instant after);
    long countByUserIdAndStatusAndCreatedAtAfter(UUID userId, Transaction.TransactionStatus status, Instant after);
    List<Transaction> findTop5ByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT t FROM Transaction t WHERE t.riskDecision IN :decisions ORDER BY t.createdAt DESC")
    Page<Transaction> findByRiskDecisionIn(@Param("decisions") List<String> decisions, Pageable pageable);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.user.id = :userId AND t.status = :status AND t.createdAt > :after")
    long countFailedTransactionsByUserIdAfter(@Param("userId") UUID userId,
                                               @Param("status") Transaction.TransactionStatus status,
                                               @Param("after") Instant after);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.status IN :statuses")
    Long sumAmountByStatusIn(@Param("statuses") List<Transaction.TransactionStatus> statuses);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.status = :status")
    long countByStatus(@Param("status") Transaction.TransactionStatus status);
}
