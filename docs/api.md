# PayShield — REST API Documentation

Base URL: `http://localhost:8080/api/v1`  
Swagger UI: `http://localhost:8080/swagger-ui/index.html`  
OpenAPI JSON: `http://localhost:8080/v3/api-docs`

---

## 1. Authentication Endpoints

### Register Customer
- **Endpoint**: `POST /api/v1/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "username": "customer1",
  "email": "customer@payshield.com",
  "password": "Customer@123",
  "fullName": "Test Customer"
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "userId": "a7b3...",
    "email": "customer@payshield.com",
    "role": "CUSTOMER",
    "fullName": "Test Customer"
  },
  "message": "Registration successful"
}
```

### User Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "admin@payshield.com",
  "password": "Admin@123"
}
```

---

## 2. Payment Management Endpoints

### Create Payment Order
- **Endpoint**: `POST /api/v1/payments/orders`
- **Headers**:
  - `Authorization: Bearer <token>`
  - `Idempotency-Key: <unique-uuid>` *(Optional but recommended)*
- **Request Body**:
```json
{
  "amount": 50000,
  "description": "Monthly Cloud Invoice",
  "simulatedLocation": "Mumbai"
}
```
*Note: Amount is specified in integer minor units (paise). ₹500.00 = 50000 paise.*

- **Response (Approved)**:
```json
{
  "success": true,
  "data": {
    "transactionId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "razorpayOrderId": "order_ODZ1h68e3xT8L1",
    "amount": 50000,
    "currency": "INR",
    "razorpayKeyId": "rzp_test_placeholder",
    "status": "ORDER_CREATED",
    "riskDecision": "APPROVED",
    "riskScore": 15,
    "riskExplanation": "Transaction approved"
  }
}
```

### Verify Payment
- **Endpoint**: `POST /api/v1/payments/verify`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "razorpayOrderId": "order_ODZ1h68e3xT8L1",
  "razorpayPaymentId": "pay_ODZ1h68e3xT8L2",
  "razorpaySignature": "26a27e..."
}
```
- **Response**: `200 OK` (Transaction record in `CAPTURED` status)

### Get Payment History
- **Endpoint**: `GET /api/v1/payments?page=0&size=10&sort=createdAt,desc`
- **Headers**: `Authorization: Bearer <token>`

### Get Transaction Details
- **Endpoint**: `GET /api/v1/payments/{id}`
- **Headers**: `Authorization: Bearer <token>`

### Request Refund
- **Endpoint**: `POST /api/v1/payments/{id}/refund`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "amount": 50000,
  "reason": "Customer cancellation"
}
```

---

## 3. Risk Assessment Endpoints

### Pre-flight Risk Evaluation
- **Endpoint**: `POST /api/v1/risk/evaluate`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "amount": 2500000,
  "simulatedLocation": "Delhi"
}
```

---

## 4. Webhooks

### Razorpay Webhook Receiver
- **Endpoint**: `POST /api/v1/webhooks/razorpay`
- **Headers**: `X-Razorpay-Signature: <hmac-signature>`
- **Payload**: Raw JSON event payload from Razorpay (e.g. `payment.captured`, `payment.failed`, `refund.processed`)

---

## 5. Administrative Endpoints (Role: ADMIN)

- `GET /api/v1/admin/dashboard`: Aggregated platform volume, success rate, and risk distributions.
- `GET /api/v1/admin/transactions`: Complete transaction ledger.
- `GET /api/v1/admin/flagged-transactions`: Flagged high-risk transactions.
- `GET /api/v1/admin/audit-logs`: Security and operational audit log stream.
