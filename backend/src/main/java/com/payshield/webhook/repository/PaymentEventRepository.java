package com.payshield.webhook.repository;

import com.payshield.webhook.entity.PaymentEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentEventRepository extends JpaRepository<PaymentEvent, UUID> {
    Optional<PaymentEvent> findByRazorpayEventId(String eventId);
    boolean existsByRazorpayEventId(String eventId);
}
