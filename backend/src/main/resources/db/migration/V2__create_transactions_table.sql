CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    amount BIGINT NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    description TEXT,
    payment_method VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    risk_score INTEGER,
    risk_decision VARCHAR(30),
    risk_explanation TEXT,
    idempotency_key VARCHAR(255) UNIQUE,
    simulated_location VARCHAR(100),
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_razorpay_order_id ON transactions(razorpay_order_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_idempotency_key ON transactions(idempotency_key);

