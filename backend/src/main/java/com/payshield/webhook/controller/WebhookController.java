package com.payshield.webhook.controller;

import com.payshield.gateway.service.RazorpayGatewayService;
import com.payshield.webhook.entity.PaymentEvent;
import com.payshield.webhook.repository.PaymentEventRepository;
import com.payshield.webhook.service.WebhookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@Tag(name = "Webhooks", description = "Razorpay webhook receiver")
@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final RazorpayGatewayService gatewayService;
    private final PaymentEventRepository paymentEventRepository;
    private final WebhookService webhookService;

    @Value("${razorpay.webhook-secret}")
    private String webhookSecret;

    @Operation(summary = "Process incoming Razorpay webhook events")
    @PostMapping("/razorpay")
    public ResponseEntity<Map<String, String>> handleWebhook(
        @RequestBody String rawBody,
        @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature
    ) {
        if (signature == null || signature.isBlank()) {
            log.warn("Webhook received without signature");
            return ResponseEntity.badRequest().body(Map.of("error", "Missing signature"));
        }

        boolean isValid = gatewayService.verifyWebhookSignature(rawBody, signature, webhookSecret);
        if (!isValid) {
            log.warn("Webhook signature verification failed");
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid signature"));
        }

        try {
            JSONObject payload = new JSONObject(rawBody);
            String eventId = payload.optString("id", null);
            String eventType = payload.optString("event", "unknown");

            if (eventId != null && paymentEventRepository.existsByRazorpayEventId(eventId)) {
                log.info("Duplicate webhook event: {}", eventId);
                return ResponseEntity.ok(Map.of("status", "already_processed"));
            }

            PaymentEvent event = PaymentEvent.builder()
                .razorpayEventId(eventId)
                .eventType(eventType)
                .payload(rawBody)
                .processed(false)
                .build();
            paymentEventRepository.save(event);

            switch (eventType) {
                case "payment.captured" -> webhookService.processPaymentCaptured(payload);
                case "payment.failed" -> webhookService.processPaymentFailed(payload);
                case "refund.processed" -> webhookService.processRefundProcessed(payload);
                default -> log.info("Unhandled webhook event type: {}", eventType);
            }

            event.setProcessed(true);
            paymentEventRepository.save(event);

            return ResponseEntity.ok(Map.of("status", "processed"));
        } catch (Exception e) {
            log.error("Error processing webhook: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Processing error"));
        }
    }
}

