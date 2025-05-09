-- Drop the tokens table if it exists
DROP TABLE IF EXISTS tokens;

-- Create the tokens table with the exact structure your code expects
CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'access', 'refresh', 'verification', 'password_reset'
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tokens_token ON tokens(token);
CREATE INDEX idx_tokens_user_id ON tokens(user_id);
CREATE INDEX idx_tokens_expires_at ON tokens(expires_at);

-- Add timestamp trigger
CREATE TRIGGER update_tokens_timestamp BEFORE UPDATE ON tokens
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Record this migration
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'record_migration') THEN
        PERFORM record_migration('20250401000004');
    END IF;
END $$;
