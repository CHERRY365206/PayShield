package com.payshield.webhook;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.payshield.webhook.service.WebhookService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WebhookControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private WebhookService webhookService;

    private String computeHmac(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(keySpec);
        return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void webhookWithValidSignatureShouldBeProcessed() throws Exception {
        String payload = "{\"id\":\"evt_test123\",\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_test\",\"order_id\":\"order_test\"}}}}";
        String secret = "test_webhook_secret_12345";
        String signature = computeHmac(payload, secret);

        mockMvc.perform(post("/api/v1/webhooks/razorpay")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)
                .header("X-Razorpay-Signature", signature))
            .andExpect(status().isOk());
    }

    @Test
    void webhookWithInvalidSignatureShouldBeRejected() throws Exception {
        String payload = "{\"event\":\"payment.captured\"}";
        mockMvc.perform(post("/api/v1/webhooks/razorpay")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)
                .header("X-Razorpay-Signature", "invalid_signature_here"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void webhookWithoutSignatureShouldBeRejected() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/razorpay")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"event\":\"test\"}"))
            .andExpect(status().isBadRequest());
    }
}
