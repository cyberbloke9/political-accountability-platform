-- Political Accountability Platform PostgreSQL Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE citizen_title_enum AS ENUM ('Citizen', 'Watchdog', 'Guardian', 'Champion', 'Sentinel');
CREATE TYPE promise_status_enum AS ENUM ('pending', 'in_progress', 'fulfilled', 'broken', 'disputed');
CREATE TYPE verification_status_enum AS ENUM ('pending', 'approved', 'rejected', 'disputed');
CREATE TYPE completion_status_enum AS ENUM ('not_started', 'partial', 'completed', 'exceeded');
CREATE TYPE timeline_status_enum AS ENUM ('early', 'on_time', 'delayed', 'very_delayed');
CREATE TYPE budget_status_enum AS ENUM ('under_budget', 'on_budget', 'over_budget', 'unknown');
CREATE TYPE vote_type_enum AS ENUM ('approve', 'reject');
CREATE TYPE evidence_file_type_enum AS ENUM ('image', 'video');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    citizen_score INTEGER NOT NULL DEFAULT 0,
    citizen_title citizen_title_enum NOT NULL DEFAULT 'Citizen',
    reputation DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE promises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    leader_name VARCHAR(100) NOT NULL,
    leader_party VARCHAR(100) NOT NULL,
    constituency VARCHAR(100),
    promised_date DATE NOT NULL,
    target_completion_date DATE,
    location VARCHAR(150) NOT NULL,
    status promise_status_enum NOT NULL DEFAULT 'pending',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promise_id UUID NOT NULL REFERENCES promises(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    completion_status completion_status_enum NOT NULL,
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    timeline_status timeline_status_enum NOT NULL,
    budget_status budget_status_enum NOT NULL DEFAULT 'unknown',
    impact_rating INTEGER CHECK (impact_rating >= 1 AND impact_rating <= 5),
    description TEXT NOT NULL,
    verification_status verification_status_enum NOT NULL DEFAULT 'pending',
    community_votes_for INTEGER NOT NULL DEFAULT 0,
    community_votes_against INTEGER NOT NULL DEFAULT 0,
    expert_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    evidence_metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    vote_type vote_type_enum NOT NULL,
    weight DECIMAL(3, 1) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (verification_id, user_id)
);

CREATE TABLE evidence_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
    file_type evidence_file_type_enum NOT NULL,
    storage_url VARCHAR(500) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    thumbnail_url VARCHAR(500),
    metadata JSONB NOT NULL DEFAULT '{}',
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_citizen_score ON users(citizen_score DESC);
CREATE INDEX idx_promises_status ON promises(status);
CREATE INDEX idx_promises_created_by ON promises(created_by);
CREATE INDEX idx_verifications_promise_id ON verifications(promise_id);
CREATE INDEX idx_verifications_status ON verifications(verification_status);
CREATE INDEX idx_votes_verification_id ON votes(verification_id);
CREATE INDEX idx_evidence_verification_id ON evidence_files(verification_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
