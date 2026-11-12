# PayShield — Testing Strategy

## Overview

PayShield includes automated tests covering risk rule evaluation, signature security, idempotency key guarantees, and authorization boundaries.

## Running Tests

From the backend directory:

```powershell
$env:JAVA_HOME = "C:\Users\Dell\AppData\Local\Programs\Eclipse Adoptium\jdk-21.0.13.9-hotspot"
& "E:\pay\maven\apache-maven-3.9.9\bin\mvn.cmd" clean test "-Dspring.profiles.active=test"
```

## Test Suite Breakdown

| Test Suite | Purpose | Key Assertions |
|------------|---------|----------------|
| `RiskAssessmentEngineTest` | Rule-based scoring engine | Verified 0–5k baseline (APPROVED), 5k–20k elevated risk, &gt;20k threshold (DECLINED), velocity limit thresholds (3/min, 5/5min), repeat failure penalties, location anomalies, and score clamping to 100. |
| `AuthControllerTest` | Customer registration & login | Validates email patterns, duplicate customer rejections, password constraints, and bad credential 401 handling. |
| `PaymentServiceTest` | Payment lifecycle | Asserts order creation gate prevents gateway call on DECLINED, executes order creation on APPROVED, verifies HMAC-SHA256 signature, and rejects tampered signatures. |
| `WebhookControllerTest` | Webhook security | Validates valid HMAC signature processing, tampered signature rejection (400), and missing signature rejection (400). |
| `IdempotencyServiceTest` | Duplicate request prevention | Verifies SHA-256 canonical hashing, concurrent idempotency record creation, identical request replay, and 409 Conflict on payload mismatch. |

All tests utilize H2 in-memory storage and Mockito mocks for external Razorpay network operations.
