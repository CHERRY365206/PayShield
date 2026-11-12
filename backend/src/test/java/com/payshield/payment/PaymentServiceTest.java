package com.payshield.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.payshield.audit.service.AuditService;
import com.payshield.auth.entity.User;
import com.payshield.auth.repository.UserRepository;
import com.payshield.common.exception.PaymentException;
import com.payshield.gateway.service.RazorpayGatewayService;
import com.payshield.idempotency.service.IdempotencyService;
import com.payshield.payment.dto.CreateOrderRequest;
import com.payshield.payment.dto.CreateOrderResponse;
import com.payshield.payment.dto.VerifyPaymentRequest;
import com.payshield.payment.entity.Transaction;
import com.payshield.payment.repository.TransactionRepository;
import com.payshield.payment.service.PaymentService;
import com.payshield.refund.repository.RefundRepository;
import com.payshield.risk.dto.RiskResult;
import com.payshield.risk.engine.RiskAssessmentEngine;
import com.payshield.risk.repository.RiskAssessmentRepository;
import com.razorpay.Order;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock private TransactionRepository transactionRepository;
    @Mock private UserRepository userRepository;
    @Mock private RiskAssessmentEngine riskEngine;
    @Mock private RiskAssessmentRepository riskAssessmentRepository;
    @Mock private RazorpayGatewayService gatewayService;
    @Mock private IdempotencyService idempotencyService;
    @Mock private RefundRepository refundRepository;
    @Mock private AuditService auditService;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private PaymentService paymentService;

    private User user;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = User.builder().id(userId).email("customer@example.com").fullName("Test User").role(User.Role.CUSTOMER).build();
        ReflectionTestUtils.setField(paymentService, "razorpayKeyId", "rzp_test_123");
    }

    @Test
    void createOrderApprovedShouldCreateRazorpayOrder() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> {
            Transaction t = i.getArgument(0);
            if (t.getId() == null) t.setId(UUID.randomUUID());
            return t;
        });

        RiskResult approvedRisk = new RiskResult(15, "APPROVED", 0, 0, 0, 0, List.of());
        when(riskEngine.evaluate(eq(userId), eq(50000L), any())).thenReturn(approvedRisk);

        JSONObject orderJson = new JSONObject();
        orderJson.put("id", "order_test_123");
        orderJson.put("amount", 50000L);
        Order mockOrder = new Order(orderJson);
        when(gatewayService.createOrder(eq(50000L), eq("INR"), anyString())).thenReturn(mockOrder);

        CreateOrderRequest request = new CreateOrderRequest(50000L, "Test payment", "Mumbai");
        CreateOrderResponse response = paymentService.createOrder(userId, request, null);

        assertThat(response).isNotNull();
        assertThat(response.status()).isEqualTo("ORDER_CREATED");
        assertThat(response.riskDecision()).isEqualTo("APPROVED");
        assertThat(response.razorpayOrderId()).isEqualTo("order_test_123");
        verify(gatewayService, times(1)).createOrder(eq(50000L), eq("INR"), anyString());
    }

    @Test
    void createOrderDeclinedShouldNotCreateGatewayOrder() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> {
            Transaction t = i.getArgument(0);
            if (t.getId() == null) t.setId(UUID.randomUUID());
            return t;
        });

        RiskResult declinedRisk = new RiskResult(85, "DECLINED", 25, 30, 20, 10, List.of("High velocity detected"));
        when(riskEngine.evaluate(eq(userId), eq(50000L), any())).thenReturn(declinedRisk);

        CreateOrderRequest request = new CreateOrderRequest(50000L, "Suspicious payment", null);
        CreateOrderResponse response = paymentService.createOrder(userId, request, null);

        assertThat(response.status()).isEqualTo("REJECTED");
        assertThat(response.riskDecision()).isEqualTo("DECLINED");
        assertThat(response.razorpayOrderId()).isNull();
        verify(gatewayService, never()).createOrder(anyLong(), anyString(), anyString());
    }

    @Test
    void verifyPaymentValidSignatureShouldCapturePayment() {
        Transaction tx = Transaction.builder()
            .id(UUID.randomUUID())
            .user(user)
            .amount(10000L)
            .razorpayOrderId("order_test_123")
            .status(Transaction.TransactionStatus.ORDER_CREATED)
            .build();

        when(transactionRepository.findByRazorpayOrderId("order_test_123")).thenReturn(Optional.of(tx));
        when(gatewayService.verifyPaymentSignature("order_test_123", "pay_test_123", "valid_sig")).thenReturn(true);
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

        VerifyPaymentRequest req = new VerifyPaymentRequest("order_test_123", "pay_test_123", "valid_sig");
        var result = paymentService.verifyPayment(req);

        assertThat(result.status()).isEqualTo("CAPTURED");
        assertThat(result.razorpayPaymentId()).isEqualTo("pay_test_123");
    }

    @Test
    void verifyPaymentInvalidSignatureShouldThrowException() {
        Transaction tx = Transaction.builder()
            .id(UUID.randomUUID())
            .user(user)
            .amount(10000L)
            .razorpayOrderId("order_test_123")
            .status(Transaction.TransactionStatus.ORDER_CREATED)
            .build();

        when(transactionRepository.findByRazorpayOrderId("order_test_123")).thenReturn(Optional.of(tx));
        when(gatewayService.verifyPaymentSignature("order_test_123", "pay_test_123", "bad_sig")).thenReturn(false);

        VerifyPaymentRequest req = new VerifyPaymentRequest("order_test_123", "pay_test_123", "bad_sig");

        assertThatThrownBy(() -> paymentService.verifyPayment(req))
            .isInstanceOf(PaymentException.class)
            .hasMessageContaining("signature verification failed");
    }
}

