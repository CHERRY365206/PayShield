package com.payshield.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class RazorpayConfig {

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    @Bean
    public RazorpayClient razorpayClient() {
        try {
            log.info("Initializing Razorpay client with key: {}...", keyId != null && keyId.length() > 8 ? keyId.substring(0, 8) : "default");
            return new RazorpayClient(keyId, keySecret);
        } catch (RazorpayException e) {
            log.warn("Failed to initialize Razorpay client with provided keys: {}. Using dummy client.", e.getMessage());
            try {
                return new RazorpayClient("rzp_test_placeholder", "placeholder_secret");
            } catch (RazorpayException ex) {
                throw new RuntimeException("Cannot initialize Razorpay client", ex);
            }
        }
    }
}

