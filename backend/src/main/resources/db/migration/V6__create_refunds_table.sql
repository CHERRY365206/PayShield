CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    razorpay_refund_id VARCHAR(100),
    amount BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'INITIATED',
    reason TEXT,
    is_simulated BOOLEAN NOT NULL DEFAULT FALSE,
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refunds_transaction_id ON refunds(transaction_id);
