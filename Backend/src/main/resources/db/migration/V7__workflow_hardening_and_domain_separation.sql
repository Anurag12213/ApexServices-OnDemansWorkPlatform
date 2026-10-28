-- ===================================================================
-- ApexServices Database Migration V7
-- Workflow Hardening & Domain Separation
-- Tables: partner_profiles, completion_verifications, reviews,
--         payments, financial_ledger_entries, work_request_events
-- ===================================================================

-- 1. Modify work_requests.status to VARCHAR(50) for lifecycle expansion
ALTER TABLE work_requests MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'BROADCASTED';

-- 2. Partner Profiles: profile photo, territory, verification badges & cached aggregates
CREATE TABLE IF NOT EXISTS partner_profiles (
    user_id BIGINT NOT NULL,
    avatar_key VARCHAR(500) NULL,
    operating_territory VARCHAR(255) NULL,
    id_verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    background_verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    training_verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    rating DECIMAL(3, 2) NOT NULL DEFAULT 5.00,
    review_count INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    PRIMARY KEY (user_id),
    CONSTRAINT fk_partner_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_id_verification_status CHECK (id_verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED')),
    CONSTRAINT chk_background_status CHECK (background_verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED')),
    CONSTRAINT chk_training_status CHECK (training_verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'))
);

-- Safe backfill for existing partners
INSERT INTO partner_profiles (user_id, operating_territory, id_verification_status, background_verification_status, training_verification_status, rating, review_count)
SELECT u.id, 'Central Service Territory (15 km radius)', 'VERIFIED', 'VERIFIED', 'VERIFIED', 5.00, 0
FROM users u
WHERE u.role = 'ROLE_PARTNER'
  AND NOT EXISTS (SELECT 1 FROM partner_profiles pp WHERE pp.user_id = u.id);

-- 3. Completion Verifications: Secure OTP HMAC, salt, attempt limits, single-use lock
CREATE TABLE IF NOT EXISTS completion_verifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    work_request_id VARCHAR(50) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    encrypted_code VARCHAR(255) NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    expires_at DATETIME(6) NOT NULL,
    consumed_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),
    KEY idx_comp_verif_req (work_request_id),
    CONSTRAINT fk_comp_verif_request FOREIGN KEY (work_request_id) REFERENCES work_requests(id) ON DELETE CASCADE
);

-- 4. Reviews: Customer reviews & ratings (enforce exactly one review per work request)
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT NOT NULL AUTO_INCREMENT,
    work_request_id VARCHAR(50) NOT NULL,
    customer_id BIGINT NOT NULL,
    partner_id BIGINT NOT NULL,
    rating INT NOT NULL,
    review_text VARCHAR(2000) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),
    UNIQUE KEY uq_review_work_request (work_request_id),
    KEY idx_reviews_partner_status (partner_id, status),
    CONSTRAINT fk_review_request FOREIGN KEY (work_request_id) REFERENCES work_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_partner FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_review_status CHECK (status IN ('PUBLISHED', 'HIDDEN', 'REMOVED'))
);

-- 5. Payments: Durable payment attempt records with idempotency key
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    work_request_id VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    idempotency_key VARCHAR(100) NOT NULL,
    provider_reference VARCHAR(255) NULL,
    paid_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),
    UNIQUE KEY uq_payment_idempotency (idempotency_key),
    KEY idx_payment_request_status (work_request_id, status),
    CONSTRAINT fk_payment_request FOREIGN KEY (work_request_id) REFERENCES work_requests(id) ON DELETE CASCADE,
    CONSTRAINT chk_payment_amount CHECK (amount >= 0),
    CONSTRAINT chk_payment_status CHECK (status IN (
        'PENDING', 'PROCESSING', 'PAID', 'FAILED',
        'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED'
    ))
);

-- 6. Financial Ledger Entries: Immutable records of partner earnings and platform fees
CREATE TABLE IF NOT EXISTS financial_ledger_entries (
    id BIGINT NOT NULL AUTO_INCREMENT,
    payment_id BIGINT NULL,
    work_request_id VARCHAR(50) NOT NULL,
    partner_id BIGINT NOT NULL,
    entry_type VARCHAR(30) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    idempotency_key VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),
    UNIQUE KEY uq_ledger_idempotency (idempotency_key),
    KEY idx_ledger_partner (partner_id),
    KEY idx_ledger_work_request (work_request_id),
    CONSTRAINT fk_ledger_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
    CONSTRAINT fk_ledger_request FOREIGN KEY (work_request_id) REFERENCES work_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_ledger_partner FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_ledger_entry_type CHECK (entry_type IN ('PLATFORM_FEE', 'PARTNER_EARNING', 'REFUND', 'PAYOUT_DISBURSEMENT'))
);

-- 7. Work Request Events: Auditable history of service-state transitions
CREATE TABLE IF NOT EXISTS work_request_events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    work_request_id VARCHAR(50) NOT NULL,
    from_status VARCHAR(50) NULL,
    to_status VARCHAR(50) NOT NULL,
    actor_id BIGINT NULL,
    actor_role VARCHAR(50) NOT NULL,
    notes TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),
    KEY idx_wre_request (work_request_id),
    CONSTRAINT fk_wre_request FOREIGN KEY (work_request_id) REFERENCES work_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_wre_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);
