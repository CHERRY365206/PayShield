CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    risk_score INTEGER NOT NULL,
    decision VARCHAR(30) NOT NULL,
    amount_score INTEGER NOT NULL DEFAULT 0,
    velocity_score INTEGER NOT NULL DEFAULT 0,
    failure_score INTEGER NOT NULL DEFAULT 0,
    geographic_score INTEGER NOT NULL DEFAULT 0,
    reasons TEXT[],
    evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_assessments_transaction_id ON risk_assessments(transaction_id);
CREATE INDEX idx_risk_assessments_user_id ON risk_assessments(user_id);

