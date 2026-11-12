package com.payshield.idempotency;

import com.payshield.common.exception.DuplicateRequestException;
import com.payshield.idempotency.entity.IdempotencyRecord;
import com.payshield.idempotency.repository.IdempotencyRepository;
import com.payshield.idempotency.service.IdempotencyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IdempotencyServiceTest {

    @Mock
    private IdempotencyRepository idempotencyRepository;

    @InjectMocks
    private IdempotencyService idempotencyService;

    @Test
    void computeHashGeneratesConsistentSha256() {
        String hash1 = idempotencyService.computeHash("sample-payload-data");
        String hash2 = idempotencyService.computeHash("sample-payload-data");
        assertThat(hash1).isNotNull().hasSize(64).isEqualTo(hash2);
    }

    @Test
    void checkConflictWithMatchingHashShouldSucceed() {
        IdempotencyRecord record = IdempotencyRecord.builder()
            .idempotencyKey("key-123")
            .requestHash("hash-abc")
            .build();

        // Should not throw
        idempotencyService.checkConflict(record, "hash-abc");
    }

    @Test
    void checkConflictWithDifferentHashShouldThrow409() {
        IdempotencyRecord record = IdempotencyRecord.builder()
            .idempotencyKey("key-123")
            .requestHash("hash-abc")
            .build();

        assertThatThrownBy(() -> idempotencyService.checkConflict(record, "hash-xyz"))
            .isInstanceOf(DuplicateRequestException.class)
            .hasMessageContaining("different request payload");
    }

    @Test
    void storeSavesNewRecord() {
        when(idempotencyRepository.save(any(IdempotencyRecord.class))).thenAnswer(i -> i.getArgument(0));

        IdempotencyRecord stored = idempotencyService.store("key-1", "hash-1", 200, "{\"status\":\"ok\"}", UUID.randomUUID());

        assertThat(stored).isNotNull();
        assertThat(stored.getIdempotencyKey()).isEqualTo("key-1");
        verify(idempotencyRepository, times(1)).save(any(IdempotencyRecord.class));
    }
}

