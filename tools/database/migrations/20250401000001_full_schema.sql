-- Function for UUID generation if not available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table - core user information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(50),
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    phone_number VARCHAR(50),
    profile_picture VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferred_units JSONB DEFAULT '{"weight": "kg", "height": "cm", "distance": "km"}',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    roles VARCHAR(50)[] DEFAULT '{"user"}',
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'inactive',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_tier, subscription_status);

-- User profiles - extended health profile information
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    health_conditions VARCHAR(100)[],
    medications VARCHAR(100)[],
    allergies VARCHAR(100)[],
    dietary_preferences VARCHAR(50)[],
    activity_level VARCHAR(50),
    sleep_goal_hours DECIMAL(3,1),
    fitness_experience VARCHAR(50),
    motivation_factors VARCHAR(50)[],
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
    weekly_availability JSONB,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- User goals
CREATE TABLE user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL,
    target DECIMAL(8,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    target_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    progress DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_goals_status ON user_goals(status);

-- Device tokens for push notifications
CREATE TABLE device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_token UNIQUE (user_id, token)
);

CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX idx_device_tokens_token ON device_tokens(token);

-- Integration connections to external platforms
CREATE TABLE integration_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    scopes VARCHAR(100)[],
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX idx_integration_connections_user_id ON integration_connections(user_id);
CREATE INDEX idx_integration_connections_provider ON integration_connections(provider);
CREATE INDEX idx_integration_connections_status ON integration_connections(status);

-- Health data - core table for all health metrics
CREATE TABLE health_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL,
    data_subtype VARCHAR(50),
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    source_provider VARCHAR(50) NOT NULL,
    source_device_id VARCHAR(100),
    source_app_id VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_health_data_user_id ON health_data(user_id);
CREATE INDEX idx_health_data_type ON health_data(data_type, data_subtype);
CREATE INDEX idx_health_data_start_time ON health_data(start_time);
CREATE INDEX idx_health_data_source ON health_data(source_provider);

-- Activity data - detailed workout and activity information
CREATE TABLE activity_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    health_data_id UUID REFERENCES health_data(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_seconds INTEGER NOT NULL,
    distance DECIMAL(10,2),
    distance_unit VARCHAR(10),
    calories_burned INTEGER,
    steps INTEGER,
    heart_rate_avg INTEGER,
    heart_rate_max INTEGER,
    source_provider VARCHAR(50) NOT NULL,
    source_device_id VARCHAR(100),
    location_data JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_data_user_id ON activity_data(user_id);
CREATE INDEX idx_activity_data_type ON activity_data(activity_type);
CREATE INDEX idx_activity_data_start_time ON activity_data(start_time);

-- Sleep data - detailed sleep information
CREATE TABLE sleep_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    health_data_id UUID REFERENCES health_data(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_seconds INTEGER NOT NULL,
    quality INTEGER CHECK (quality BETWEEN 1 AND 100),
    sleep_stages JSONB,
    heart_rate_avg INTEGER,
    respiratory_rate_avg DECIMAL(5,2),
    temperature_avg DECIMAL(5,2),
    disturbance_count INTEGER,
    environmental_factors JSONB,
    source_provider VARCHAR(50) NOT NULL,
    source_device_id VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sleep_data_user_id ON sleep_data(user_id);
CREATE INDEX idx_sleep_data_start_time ON sleep_data(start_time);
CREATE INDEX idx_sleep_data_quality ON sleep_data(quality);

-- Nutrition data - meals and nutrition information
CREATE TABLE nutrition_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    health_data_id UUID REFERENCES health_data(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    meal_type VARCHAR(50),
    foods JSONB,
    total_calories INTEGER,
    total_protein_g DECIMAL(6,2),
    total_carbohydrates_g DECIMAL(6,2),
    total_fat_g DECIMAL(6,2),
    total_fiber_g DECIMAL(6,2),
    water_intake_ml INTEGER,
    source_provider VARCHAR(50) NOT NULL,
    source_app_id VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_nutrition_data_user_id ON nutrition_data(user_id);
CREATE INDEX idx_nutrition_data_timestamp ON nutrition_data(timestamp);
CREATE INDEX idx_nutrition_data_meal_type ON nutrition_data(meal_type);

-- Mental state data - mood, stress, and mental wellbeing
CREATE TABLE mental_state_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 10),
    mood_labels VARCHAR(50)[],
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
    focus_level INTEGER CHECK (focus_level BETWEEN 1 AND 10),
    notes TEXT,
    factors VARCHAR(50)[],
    source VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mental_state_data_user_id ON mental_state_data(user_id);
CREATE INDEX idx_mental_state_data_timestamp ON mental_state_data(timestamp);
CREATE INDEX idx_mental_state_data_mood ON mental_state_data(mood_rating);
CREATE INDEX idx_mental_state_data_stress ON mental_state_data(stress_level);

-- Assessment results - onboarding and periodic assessments
CREATE TABLE assessment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scores JSONB NOT NULL,
    recommended_focus VARCHAR(50)[],
    raw_responses JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assessment_results_user_id ON assessment_results(user_id);
CREATE INDEX idx_assessment_results_type ON assessment_results(assessment_type);
CREATE INDEX idx_assessment_results_completed_at ON assessment_results(completed_at);

-- User insights - AI-generated insights for users
CREATE TABLE user_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL,
    data_points JSONB,
    actionable BOOLEAN DEFAULT TRUE,
    actions JSONB,
    viewed BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    dismissed BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_insights_user_id ON user_insights(user_id);
CREATE INDEX idx_user_insights_type_category ON user_insights(insight_type, category);
CREATE INDEX idx_user_insights_valid_dates ON user_insights(valid_from, valid_to);
CREATE INDEX idx_user_insights_viewed ON user_insights(viewed);

-- Daily recommendations - personalized daily health plans
CREATE TABLE daily_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    readiness_score INTEGER CHECK (readiness_score BETWEEN 1 AND 100),
    focus_areas JSONB,
    recommendations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

CREATE INDEX idx_daily_recommendations_user_id_date ON daily_recommendations(user_id, date);

-- Notifications - user notifications and reminders
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'normal',
    deep_link VARCHAR(255),
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    sent_via VARCHAR(50)[],
    delivery_status JSONB DEFAULT '{"push": "pending", "email": "pending", "sms": "pending"}',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_scheduled_at ON notifications(scheduled_at);

-- User feedback - feedback on recommendations and insights
CREATE TABLE user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) NOT NULL,
    reference_id UUID NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_reference ON user_feedback(reference_id);

-- Vector embeddings record - links to Pinecone vectors
CREATE TABLE vector_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vector_type VARCHAR(50) NOT NULL,
    pinecone_id VARCHAR(100) NOT NULL,
    reference_date DATE NOT NULL,
    reference_object_type VARCHAR(50) NOT NULL,
    reference_object_id UUID NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vector_embeddings_user_id ON vector_embeddings(user_id);
CREATE INDEX idx_vector_embeddings_pinecone_id ON vector_embeddings(pinecone_id);
CREATE INDEX idx_vector_embeddings_reference ON vector_embeddings(reference_object_type, reference_object_id);

-- Audit logs for sensitive operations
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Schema migrations table
CREATE TABLE schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the timestamp trigger to all tables with updated_at
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_user_profiles_timestamp BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_user_goals_timestamp BEFORE UPDATE ON user_goals
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_integration_connections_timestamp BEFORE UPDATE ON integration_connections
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_health_data_timestamp BEFORE UPDATE ON health_data
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_activity_data_timestamp BEFORE UPDATE ON activity_data
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_sleep_data_timestamp BEFORE UPDATE ON sleep_data
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_nutrition_data_timestamp BEFORE UPDATE ON nutrition_data
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_user_insights_timestamp BEFORE UPDATE ON user_insights
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_daily_recommendations_timestamp BEFORE UPDATE ON daily_recommendations
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_notifications_timestamp BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_vector_embeddings_timestamp BEFORE UPDATE ON vector_embeddings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Function to check if migration has been applied
CREATE OR REPLACE FUNCTION is_migration_applied(p_version VARCHAR) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM schema_migrations WHERE version = p_version
  );
END;
$$ LANGUAGE plpgsql;

-- Function to record applied migration
CREATE OR REPLACE FUNCTION record_migration(p_version VARCHAR) 
RETURNS VOID AS $$
BEGIN
  INSERT INTO schema_migrations(version) VALUES (p_version);
END;
$$ LANGUAGE plpgsql;

-- Record this migration
SELECT record_migration('20250401000001');
