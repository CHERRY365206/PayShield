CREATE TABLE payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id),
    razorpay_event_id VARCHAR(100) UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_events_transaction_id ON payment_events(transaction_id);
CREATE INDEX idx_payment_events_razorpay_event_id ON payment_events(razorpay_event_id);
