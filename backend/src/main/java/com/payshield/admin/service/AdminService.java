package com.payshield.admin.service;

import com.payshield.admin.dto.DashboardStats;
import com.payshield.audit.entity.AuditLog;
import com.payshield.audit.repository.AuditLogRepository;
import com.payshield.payment.dto.TransactionDTO;
import com.payshield.payment.entity.Transaction;
import com.payshield.payment.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final TransactionRepository transactionRepository;
    private final AuditLogRepository auditLogRepository;

    public DashboardStats getDashboardStats() {
        long total = transactionRepository.count();
        long successful = transactionRepository.countByStatus(Transaction.TransactionStatus.CAPTURED);
        long failed = transactionRepository.countByStatus(Transaction.TransactionStatus.FAILED);
        long pending = transactionRepository.countByStatus(Transaction.TransactionStatus.PENDING_REVIEW)
            + transactionRepository.countByStatus(Transaction.TransactionStatus.ORDER_CREATED);
        long flagged = transactionRepository.countByStatus(Transaction.TransactionStatus.PENDING_REVIEW);
        long declined = transactionRepository.countByStatus(Transaction.TransactionStatus.REJECTED);

        Long totalVolume = transactionRepository.sumAmountByStatusIn(
            List.of(Transaction.TransactionStatus.CAPTURED, Transaction.TransactionStatus.VERIFIED));
        long totalVolumeInPaise = totalVolume != null ? totalVolume : 0L;

        double successRate = total > 0 ? ((double) successful / total) * 100.0 : 0.0;

        DashboardStats.RiskDistribution riskDist = new DashboardStats.RiskDistribution(
            Math.max(0, total - flagged - declined),
            flagged,
            declined
        );

        return new DashboardStats(total, successful, failed, pending, flagged, declined,
            totalVolumeInPaise, successRate, riskDist);
    }

    public Page<TransactionDTO> getAllTransactions(Pageable pageable) {
        return transactionRepository.findAll(pageable).map(TransactionDTO::from);
    }

    public Page<TransactionDTO> getFlaggedTransactions(Pageable pageable) {
        return transactionRepository.findByRiskDecisionIn(
            List.of("REVIEW_REQUIRED", "DECLINED"), pageable).map(TransactionDTO::from);
    }

    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }
}
