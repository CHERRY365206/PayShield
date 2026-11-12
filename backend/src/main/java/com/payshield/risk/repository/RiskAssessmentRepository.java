package com.payshield.risk.repository;

import com.payshield.risk.entity.RiskAssessment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, UUID> {
    Optional<RiskAssessment> findByTransactionId(UUID transactionId);
    Page<RiskAssessment> findByUserId(UUID userId, Pageable pageable);
}
