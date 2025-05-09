-- Tokens table for authentication tokens (access, refresh, verification, etc.)
CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_type VARCHAR(50) NOT NULL, -- 'access', 'refresh', 'verification', 'password_reset'
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_token_type UNIQUE (user_id, token_type, token)
);

CREATE INDEX idx_tokens_token ON tokens(token);
CREATE INDEX idx_tokens_user_id ON tokens(user_id);
CREATE INDEX idx_tokens_expires_at ON tokens(expires_at);

-- Add timestamp trigger
CREATE TRIGGER update_tokens_timestamp BEFORE UPDATE ON tokens
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Record this migration
SELECT record_migration('20250401000002');
