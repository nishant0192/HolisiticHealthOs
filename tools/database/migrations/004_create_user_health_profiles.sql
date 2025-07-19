-- Migration: Create user_health_profiles table
-- Description: Creates the health profiles table for storing user health-related data

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_health_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    health_conditions VARCHAR(100)[],
    medications VARCHAR(100)[],
    allergies VARCHAR(100)[],
    dietary_preferences VARCHAR(50)[],
    activity_level VARCHAR(50),
    sleep_goal_hours NUMERIC(3,1),
    fitness_experience VARCHAR(50),
    motivation_factors VARCHAR(50)[],
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
    preferred_units JSONB DEFAULT '{}'::jsonb,
    notification_preferences JSONB DEFAULT '{}'::jsonb,
    weekly_availability JSONB DEFAULT '{}'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT idx_user_health_profiles_user_id UNIQUE (user_id)
);

-- Add an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_health_profiles_user_id ON user_health_profiles(user_id);

-- Create a trigger to automatically update the updated_at timestamp
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_health_profiles_timestamp') THEN
        CREATE TRIGGER update_user_health_profiles_timestamp
        BEFORE UPDATE ON user_health_profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_timestamp();
    END IF;
END
$$;

-- Insert a comment to document the table
COMMENT ON TABLE user_health_profiles IS 'Stores health-related information for users such as health conditions, preferences, and metrics';
