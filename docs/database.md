# PayShield — Database Design & Schema

PayShield utilizes PostgreSQL 16 managed via Flyway versioned migrations.

## Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o{ transactions : initiates
    users ||--o{ risk_assessments : evaluated_for
    users ||--o{ audit_logs : triggers
    transactions ||--o{ risk_assessments : assessed_by
    transactions ||--o{ payment_events : receives
    transactions ||--o{ refunds : refunds
    transactions ||--o| idempotency_records : caches

    users {
        uuid id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar role
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    transactions {
        uuid id PK
        uuid user_id FK
        varchar razorpay_order_id
        varchar razorpay_payment_id
        bigint amount
        varchar currency
        text description
        varchar payment_method
        varchar status
        int risk_score
        varchar risk_decision
        text risk_explanation
        varchar idempotency_key UK
        varchar simulated_location
        jsonb gateway_response
        timestamp created_at
        timestamp updated_at
    }

    payment_events {
        uuid id PK
        uuid transaction_id FK
        varchar razorpay_event_id UK
        varchar event_type
        jsonb payload
        boolean processed
        timestamp created_at
    }

    risk_assessments {
        uuid id PK
        uuid transaction_id FK
        uuid user_id FK
        int risk_score
        varchar decision
        int amount_score
        int velocity_score
        int failure_score
        int geographic_score
        text[] reasons
        timestamp evaluated_at
    }

    idempotency_records {
        uuid id PK
        varchar idempotency_key UK
        varchar request_hash
        text response_body
        int http_status
        uuid transaction_id FK
        timestamp created_at
        timestamp expires_at
    }

    refunds {
        uuid id PK
        uuid transaction_id FK
        varchar razorpay_refund_id
        bigint amount
        varchar status
        text reason
        boolean is_simulated
        jsonb gateway_response
        timestamp created_at
        timestamp updated_at
    }

    audit_logs {
        uuid id PK
        uuid user_id FK
        varchar action
        varchar entity_type
        uuid entity_id
        text details
        varchar ip_address
        timestamp created_at
    }
```

## Migration Catalog

1. `V1__create_users_table.sql`: Customer & Admin user entity with BCrypt hashes.
2. `V2__create_transactions_table.sql`: Primary transaction ledger storing minor units (paise) and gateway tokens.
3. `V3__create_payment_events_table.sql`: Webhook event deduplication ledger.
4. `V4__create_risk_assessments_table.sql`: Explainable breakdown of risk factor weights and reasons.
5. `V5__create_idempotency_records_table.sql`: Request-hash and response caching for network retry safety.
6. `V6__create_refunds_table.sql`: Lifecycle tracking for full and partial refunds with simulation support.
7. `V7__create_audit_logs_table.sql`: Security, authorization, and audit log table.
8. `V8__seed_admin_user.sql`: Production baseline reference (dynamic seeding handled by `DataInitializer`).
