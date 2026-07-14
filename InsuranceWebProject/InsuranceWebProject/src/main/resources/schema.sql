-- =====================================================
-- Insurance Policy Management System
-- Database Initialization Script
-- PostgreSQL with PGVector Extension
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Seed default roles
INSERT INTO roles (name) VALUES ('ROLE_CUSTOMER') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('ROLE_AGENT') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('ROLE_CLAIMS_OFFICER') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('ROLE_ADMIN') ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),
    profile_image_url VARCHAR(500),
    kyc_status VARCHAR(20) DEFAULT 'PENDING',
    account_status VARCHAR(20) DEFAULT 'ACTIVE',
    last_login_at TIMESTAMP,
    license_number VARCHAR(50),
    license_expiry_date DATE,
    lifetime_commission DECIMAL(15,2) DEFAULT 0,
    customer_count INT DEFAULT 0,
    email_verified BOOLEAN DEFAULT FALSE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    provider VARCHAR(50) DEFAULT 'local',
    provider_id VARCHAR(255),
    enabled BOOLEAN DEFAULT TRUE,
    account_non_locked BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- USER_ROLES JOIN TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- =====================================================
-- POLICY TYPES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS policy_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed policy types
INSERT INTO policy_types (name, description) VALUES
    ('HEALTH', 'Health Insurance covers medical expenses including hospitalization, surgery, and treatments.') ON CONFLICT (name) DO NOTHING;
INSERT INTO policy_types (name, description) VALUES
    ('LIFE', 'Life Insurance provides financial protection to beneficiaries in case of the policyholder''s death.') ON CONFLICT (name) DO NOTHING;
INSERT INTO policy_types (name, description) VALUES
    ('MOTOR', 'Motor Insurance covers damage to vehicles and third-party liabilities from accidents.') ON CONFLICT (name) DO NOTHING;
INSERT INTO policy_types (name, description) VALUES
    ('TRAVEL', 'Travel Insurance covers trip cancellations, medical emergencies, and lost luggage during travel.') ON CONFLICT (name) DO NOTHING;
INSERT INTO policy_types (name, description) VALUES
    ('HOME', 'Home Insurance protects against damage to your home and belongings from fire, theft, and natural disasters.') ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- POLICIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    policy_type_id BIGINT NOT NULL REFERENCES policy_types(id),
    coverage_amount DECIMAL(15,2) NOT NULL,
    premium_amount DECIMAL(15,2) NOT NULL,
    benefits TEXT,
    exclusions TEXT,
    waiting_period_days INT DEFAULT 0,
    claim_process TEXT,
    documents_required TEXT,
    eligibility TEXT,
    risk_category VARCHAR(20) DEFAULT 'MEDIUM',
    duration_months INT DEFAULT 12,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CUSTOMER POLICIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_number VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    policy_id UUID NOT NULL REFERENCES policies(id),
    agent_id UUID REFERENCES users(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    premium_due_date DATE,
    premium_frequency VARCHAR(20) DEFAULT 'ANNUAL',
    last_payment_date DATE,
    premium_paid DECIMAL(15,2) DEFAULT 0,
    coverage_amount DECIMAL(15,2),
    sum_assured DECIMAL(15,2),
    term_years INT,
    quoted_premium DECIMAL(15,2),
    quote_expires_at TIMESTAMP,
    underwriting_details JSONB,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patch existing table: expand status and add missing columns (PostgreSQL 9.6+ IF NOT EXISTS)
ALTER TABLE customer_policies ALTER COLUMN status TYPE VARCHAR(50);
ALTER TABLE customer_policies ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES users(id);
ALTER TABLE customer_policies ADD COLUMN IF NOT EXISTS premium_due_date DATE;
ALTER TABLE customer_policies ADD COLUMN IF NOT EXISTS premium_frequency VARCHAR(20) DEFAULT 'ANNUAL';
ALTER TABLE customer_policies ADD COLUMN IF NOT EXISTS last_payment_date DATE;
ALTER TABLE customer_policies ADD COLUMN IF NOT EXISTS sum_assured DECIMAL(15,2);
ALTER TABLE customer_policies ADD COLUMN IF NOT EXISTS term_years INT;
ALTER TABLE customer_policies ADD COLUMN IF NOT EXISTS quoted_premium DECIMAL(15,2);
ALTER TABLE customer_policies ADD COLUMN IF NOT EXISTS quote_expires_at TIMESTAMP;
ALTER TABLE customer_policies ADD COLUMN IF NOT EXISTS underwriting_details JSONB;
ALTER TABLE customer_policies ALTER COLUMN underwriting_details TYPE JSONB USING underwriting_details::jsonb;
ALTER TABLE customer_policies ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- =====================================================
-- NOMINEES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS nominees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_policy_id UUID NOT NULL REFERENCES customer_policies(id) ON DELETE CASCADE,
    nominee_name VARCHAR(200) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    phone VARCHAR(20),
    percentage INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE nominees ALTER COLUMN phone TYPE VARCHAR(30);

-- =====================================================
-- RIDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rate_percent DECIMAL(5,2) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Policy-to-Rider join table (policy templates that offer a rider)
CREATE TABLE IF NOT EXISTS policy_riders (
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    rider_id  UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
    PRIMARY KEY (policy_id, rider_id)
);

-- =====================================================
-- CUSTOMER POLICY RIDERS (Many-to-Many join table)
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_policy_riders (
    customer_policy_id UUID NOT NULL REFERENCES customer_policies(id) ON DELETE CASCADE,
    rider_id           UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
    PRIMARY KEY (customer_policy_id, rider_id)
);

-- =====================================================
-- POLICY STATUS HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS policy_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_policy_id UUID NOT NULL REFERENCES customer_policies(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    triggered_by VARCHAR(100),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CLAIMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_number VARCHAR(20) UNIQUE NOT NULL,
    customer_policy_id UUID NOT NULL REFERENCES customer_policies(id),
    user_id UUID NOT NULL REFERENCES users(id),
    claim_type VARCHAR(50),
    description TEXT,
    claim_amount DECIMAL(15,2) NOT NULL,
    approved_amount DECIMAL(15,2),
    status VARCHAR(30) DEFAULT 'SUBMITTED',
    fraud_risk_score DOUBLE PRECISION,
    fraud_reasons TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    claim_id UUID REFERENCES claims(id),
    document_type VARCHAR(30) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_url VARCHAR(1000) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    customer_policy_id UUID NOT NULL REFERENCES customer_policies(id),
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    invoice_url VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(20) NOT NULL,
    category VARCHAR(30),
    read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- AI CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- AI MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    details TEXT,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_customer_policies_user ON customer_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_policies_status ON customer_policies(status);
CREATE INDEX IF NOT EXISTS idx_claims_user ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_policy ON claims(customer_policy_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_claim ON documents(claim_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- =====================================================
-- SAMPLE POLICIES DATA
-- =====================================================
INSERT INTO policies (id, policy_number, name, description, policy_type_id, coverage_amount, premium_amount, benefits, exclusions, waiting_period_days, claim_process, documents_required, eligibility, risk_category, duration_months, active)
VALUES
(uuid_generate_v4(), 'POL-HLTH-001', 'SecureHealth Plus', 'Comprehensive health insurance plan with cashless hospitalization across 5000+ network hospitals.',
 (SELECT id FROM policy_types WHERE name = 'HEALTH'), 500000.00, 12000.00,
 'Cashless hospitalization, Pre & post hospitalization expenses, Day care procedures, Ambulance charges, Annual health checkup',
 'Pre-existing diseases (first 2 years), Cosmetic surgery, Self-inflicted injuries, War and nuclear perils',
 30, '1. Intimate hospital/TPA within 24 hours\n2. Submit claim form with documents\n3. Cashless: Show health card at network hospital\n4. Reimbursement: Submit bills within 15 days of discharge',
 'Photo ID, Address Proof, Medical Reports, Hospital Bills, Discharge Summary',
 'Age 18-65, No major pre-existing conditions', 'LOW', 12, TRUE),

(uuid_generate_v4(), 'POL-HLTH-002', 'Family Shield Health', 'Family floater health plan covering spouse, children, and parents with single premium.',
 (SELECT id FROM policy_types WHERE name = 'HEALTH'), 1000000.00, 25000.00,
 'Family floater cover, Maternity benefits, New born baby cover, Restoration benefit, No claim bonus up to 50%',
 'Dental treatment, Vitamins and tonics, Treatment outside India, HIV/AIDS related claims',
 60, '1. Notify insurer within 48 hours\n2. Get pre-authorization for planned hospitalization\n3. Submit all original bills and reports',
 'Family members Photo ID, Age Proof, Medical History Declaration',
 'Primary member age 21-55, Family size up to 6 members', 'MEDIUM', 12, TRUE),

(uuid_generate_v4(), 'POL-LIFE-001', 'LifeGuard Term Plan', 'Pure term life insurance providing high coverage at affordable premiums.',
 (SELECT id FROM policy_types WHERE name = 'LIFE'), 10000000.00, 8500.00,
 'Death benefit (lump sum or monthly income), Terminal illness cover, Accidental death rider, Tax benefits under 80C',
 'Suicide within first year, Death due to participation in hazardous activities, Fraud or misrepresentation',
 0, '1. Nominee contacts insurance company\n2. Submit death certificate and claim form\n3. Company verifies and processes within 30 days',
 'Photo ID, Income Proof, Medical Examination Report, Nominee Details',
 'Age 18-60, Non-smoker preferred, Medical examination required for sum above 1 Crore', 'LOW', 240, TRUE),

(uuid_generate_v4(), 'POL-MOTR-001', 'DriveShield Comprehensive', 'Comprehensive motor insurance covering own damage and third-party liability.',
 (SELECT id FROM policy_types WHERE name = 'MOTOR'), 750000.00, 6500.00,
 'Own damage cover, Third-party liability, Personal accident cover, Roadside assistance, Zero depreciation add-on',
 'Driving without valid license, Driving under influence, Consequential loss, Normal wear and tear',
 0, '1. File FIR for theft/accident\n2. Inform insurer within 24 hours\n3. Get vehicle inspected by surveyor\n4. Submit repair bills from authorized garage',
 'RC Book, Driving License, FIR Copy (if applicable), Repair Estimates, Photos of Damage',
 'Valid driving license, Vehicle not older than 15 years', 'MEDIUM', 12, TRUE),

(uuid_generate_v4(), 'POL-TRVL-001', 'GlobalTravel Secure', 'International travel insurance for worry-free trips worldwide.',
 (SELECT id FROM policy_types WHERE name = 'TRAVEL'), 2500000.00, 2500.00,
 'Medical emergency cover, Trip cancellation, Lost baggage, Flight delay, Emergency evacuation, 24x7 travel assistance',
 'Pre-existing medical conditions, Adventure sports (unless add-on), Travel against medical advice, Pandemic-related cancellations',
 0, '1. Contact 24x7 helpline immediately\n2. Get treatment at approved hospital\n3. Collect all receipts and medical documents\n4. Submit claim within 30 days of return',
 'Passport Copy, Visa, Travel Itinerary, Boarding Passes, Medical Bills (if any)',
 'Age 6 months to 70 years, Valid passport required', 'LOW', 1, TRUE),

(uuid_generate_v4(), 'POL-HOME-001', 'HomeGuard Premium', 'Comprehensive home insurance protecting your property and belongings.',
 (SELECT id FROM policy_types WHERE name = 'HOME'), 5000000.00, 4500.00,
 'Building structure cover, Contents insurance, Theft and burglary, Natural disaster cover, Liability cover, Temporary accommodation',
 'Wear and tear, Willful destruction, War and terrorism, Nuclear hazard, Vacant property (>60 days)',
 15, '1. Report incident to police (for theft/burglary)\n2. Inform insurer within 48 hours\n3. Submit claim form with photographs\n4. Surveyor inspection will be arranged',
 'Property Documents, Purchase Receipts (for contents), FIR (for theft), Photographs of Damage, Repair Estimates',
 'Property owner or tenant with valid agreement, Property in India', 'LOW', 12, TRUE)
ON CONFLICT (policy_number) DO NOTHING;

-- =====================================================
-- SAMPLE ADMIN USER (password: Admin@123)
-- BCrypt hash for Admin@123
-- =====================================================
INSERT INTO users (id, first_name, last_name, email, password, phone, email_verified, enabled, customer_id)
VALUES (
    uuid_generate_v4(),
    'System',
    'Admin',
    'admin@insurancepro.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    '+91-9999999999',
    TRUE,
    TRUE,
    'CUST-ADMIN01'
) ON CONFLICT (email) DO NOTHING;

-- Assign ADMIN role to the admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@insurancepro.com' AND r.name = 'ROLE_ADMIN'
ON CONFLICT DO NOTHING;

-- =====================================================
-- SPEC V2 PRODUCT RULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS product_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_type VARCHAR(50) UNIQUE NOT NULL,
    free_look_days INT DEFAULT 15,
    lock_in_years INT DEFAULT 2,
    surrender_allowed_in_lockin BOOLEAN DEFAULT TRUE,
    surrender_value_pct DECIMAL(5,2) DEFAULT 30.00,
    reinstatement_cutoff_months INT DEFAULT 6,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default product rules
INSERT INTO product_rules (id, plan_type, free_look_days, lock_in_years, surrender_allowed_in_lockin, surrender_value_pct, reinstatement_cutoff_months, created_at, updated_at)
VALUES
(uuid_generate_v4(), 'LIFE', 15, 2, TRUE, 30.00, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(uuid_generate_v4(), 'HEALTH', 15, 1, FALSE, 0.00, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(uuid_generate_v4(), 'MOTOR', 15, 0, FALSE, 0.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(uuid_generate_v4(), 'TRAVEL', 15, 0, FALSE, 0.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(uuid_generate_v4(), 'HOME', 15, 1, TRUE, 20.00, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (plan_type) DO NOTHING;

-- Spec v2 users KYC verification tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP;

-- Spec v2 bank details dual primary flags
ALTER TABLE bank_details ADD COLUMN IF NOT EXISTS is_primary_for_debit BOOLEAN DEFAULT FALSE;
ALTER TABLE bank_details ADD COLUMN IF NOT EXISTS is_primary_for_payout BOOLEAN DEFAULT FALSE;
ALTER TABLE bank_details ADD COLUMN IF NOT EXISTS requires_reauthorization BOOLEAN DEFAULT FALSE;

-- Fix legacy is_primary column: set a default so Hibernate inserts don't fail
ALTER TABLE bank_details ALTER COLUMN is_primary SET DEFAULT false;
