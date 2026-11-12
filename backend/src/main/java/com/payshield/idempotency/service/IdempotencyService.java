package com.payshield.idempotency.service;

import com.payshield.common.exception.DuplicateRequestException;
import com.payshield.idempotency.entity.IdempotencyRecord;
import com.payshield.idempotency.repository.IdempotencyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final IdempotencyRepository idempotencyRepository;

    public String computeHash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    public Optional<IdempotencyRecord> findByKey(String key) {
        return idempotencyRepository.findByIdempotencyKey(key);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public IdempotencyRecord store(String key, String requestHash, int httpStatus,
                                    String responseBody, UUID transactionId) {
        try {
            IdempotencyRecord record = IdempotencyRecord.builder()
                .idempotencyKey(key)
                .requestHash(requestHash)
                .httpStatus(httpStatus)
                .responseBody(responseBody)
                .transactionId(transactionId)
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .build();
            return idempotencyRepository.save(record);
        } catch (DataIntegrityViolationException e) {
            // Race condition: another request stored this key first
            return idempotencyRepository.findByIdempotencyKey(key)
                .orElseThrow(() -> new DuplicateRequestException("Idempotency key conflict", 409));
        }
    }

    public void checkConflict(IdempotencyRecord existing, String newRequestHash) {
        if (!existing.getRequestHash().equals(newRequestHash)) {
            throw new DuplicateRequestException(
                "Idempotency key reused with different request payload", 409);
        }
    }
}
