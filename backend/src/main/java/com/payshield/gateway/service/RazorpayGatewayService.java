package com.payshield.gateway.service;

import com.payshield.common.exception.PaymentException;
import com.razorpay.Order;
import com.razorpay.Payment;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

@Slf4j
@Service
@RequiredArgsConstructor
public class RazorpayGatewayService {

    private final RazorpayClient razorpayClient;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    public Order createOrder(long amountInPaise, String currency, String receiptId) {
        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", currency);
            orderRequest.put("receipt", receiptId);
            orderRequest.put("payment_capture", 1);
            Order order = razorpayClient.orders.create(orderRequest);
            log.info("Created Razorpay order: {}", order.get("id").toString());
            return order;
        } catch (RazorpayException e) {
            log.error("Failed to create Razorpay order: {}", e.getMessage());
            throw new PaymentException("Failed to create payment order: " + e.getMessage(), e);
        }
    }

    public boolean verifyPaymentSignature(String razorpayOrderId, String razorpayPaymentId, String signature) {
        try {
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            String expectedSignature = computeHmacSha256(payload, keySecret);
            return MessageDigestUtils.constantTimeEquals(expectedSignature, signature);
        } catch (Exception e) {
            log.error("Signature verification error: {}", e.getMessage());
            return false;
        }
    }

    public boolean verifyWebhookSignature(String payload, String receivedSignature, String webhookSecret) {
        try {
            String expectedSignature = computeHmacSha256(payload, webhookSecret);
            return MessageDigestUtils.constantTimeEquals(expectedSignature, receivedSignature);
        } catch (Exception e) {
            log.error("Webhook signature verification error: {}", e.getMessage());
            return false;
        }
    }

    public Payment fetchPayment(String paymentId) {
        try {
            return razorpayClient.payments.fetch(paymentId);
        } catch (RazorpayException e) {
            log.error("Failed to fetch payment {}: {}", paymentId, e.getMessage());
            throw new PaymentException("Failed to fetch payment details", e);
        }
    }

    public JSONObject initiateRefund(String paymentId, long amountInPaise) {
        try {
            JSONObject refundRequest = new JSONObject();
            refundRequest.put("amount", amountInPaise);
            com.razorpay.Refund refund = razorpayClient.payments.refund(paymentId, refundRequest);
            return new JSONObject(refund.toString());
        } catch (RazorpayException e) {
            log.warn("Razorpay refund failed: {}. Will simulate refund.", e.getMessage());
            return null;
        }
    }

    private String computeHmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
