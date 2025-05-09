-- Check if the tokens table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tokens') THEN
        -- Rename token_type column to type if it exists
        IF EXISTS (SELECT FROM pg_attribute 
                  WHERE attrelid = 'tokens'::regclass 
                  AND attname = 'token_type' 
                  AND NOT attisdropped) THEN
            ALTER TABLE tokens RENAME COLUMN token_type TO type;
        -- Add the type column if it doesn't exist
        ELSIF NOT EXISTS (SELECT FROM pg_attribute 
                         WHERE attrelid = 'tokens'::regclass 
                         AND attname = 'type' 
                         AND NOT attisdropped) THEN
            ALTER TABLE tokens ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'access';
        END IF;
    ELSE
        -- Create the tokens table with the correct column structure
        CREATE TABLE tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL, -- 'access', 'refresh', 'verification', 'password_reset'
            token VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            revoked BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT unique_user_token_type UNIQUE (user_id, type, token)
        );

        CREATE INDEX idx_tokens_token ON tokens(token);
        CREATE INDEX idx_tokens_user_id ON tokens(user_id);
        CREATE INDEX idx_tokens_expires_at ON tokens(expires_at);

        -- Add timestamp trigger
        CREATE TRIGGER update_tokens_timestamp BEFORE UPDATE ON tokens
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    END IF;
END $$;

-- Record this migration
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'record_migration') THEN
        PERFORM record_migration('20250401000003');
    END IF;
END $$;
