package com.payshield.admin.controller;

import com.payshield.admin.dto.DashboardStats;
import com.payshield.admin.service.AdminService;
import com.payshield.audit.entity.AuditLog;
import com.payshield.common.dto.ApiResponse;
import com.payshield.payment.dto.TransactionDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin", description = "Administrative endpoints")
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final AdminService adminService;

    @Operation(summary = "Get dashboard statistics")
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStats>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getDashboardStats()));
    }

    @Operation(summary = "Get all transactions")
    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<Page<TransactionDTO>>> getAllTransactions(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllTransactions(pageable)));
    }

    @Operation(summary = "Get flagged/high-risk transactions")
    @GetMapping("/flagged-transactions")
    public ResponseEntity<ApiResponse<Page<TransactionDTO>>> getFlaggedTransactions(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getFlaggedTransactions(pageable)));
    }

    @Operation(summary = "Get audit logs")
    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAuditLogs(pageable)));
    }
}
