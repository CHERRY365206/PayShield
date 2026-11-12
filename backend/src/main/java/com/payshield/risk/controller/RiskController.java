package com.payshield.risk.controller;

import com.payshield.auth.entity.User;
import com.payshield.common.dto.ApiResponse;
import com.payshield.risk.dto.RiskEvaluateRequest;
import com.payshield.risk.dto.RiskResult;
import com.payshield.risk.engine.RiskAssessmentEngine;
import com.payshield.risk.entity.RiskAssessment;
import com.payshield.risk.repository.RiskAssessmentRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Risk Assessment", description = "Risk evaluation endpoints")
@RestController
@RequestMapping("/api/v1/risk")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class RiskController {

    private final RiskAssessmentEngine riskEngine;
    private final RiskAssessmentRepository riskAssessmentRepository;

    @Operation(summary = "Evaluate risk for a potential transaction without creating an order")
    @PostMapping("/evaluate")
    public ResponseEntity<ApiResponse<RiskResult>> evaluate(
        @AuthenticationPrincipal User user,
        @Valid @RequestBody RiskEvaluateRequest request
    ) {
        RiskResult result = riskEngine.evaluate(user.getId(), request.amount(), request.simulatedLocation());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @Operation(summary = "Get risk assessments for current user")
    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<Page<RiskAssessment>>> getMyRiskAssessments(
        @AuthenticationPrincipal User user,
        Pageable pageable
    ) {
        Page<RiskAssessment> assessments = riskAssessmentRepository.findByUserId(user.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(assessments));
    }

    @Operation(summary = "Get risk assessment by transaction ID")
    @GetMapping("/transactions/{id}")
    public ResponseEntity<ApiResponse<RiskAssessment>> getRiskAssessment(
        @PathVariable UUID id
    ) {
        return riskAssessmentRepository.findByTransactionId(id)
            .map(a -> ResponseEntity.ok(ApiResponse.success(a)))
            .orElse(ResponseEntity.notFound().build());
    }
}
