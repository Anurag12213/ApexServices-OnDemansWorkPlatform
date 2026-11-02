-- V9: Centralized Email OTP Verification Challenges and Cryptographic Grants Table
-- Strictly conforms to MySQL 8.4 standards and Flyway drift-detection conventions (no IF NOT EXISTS)

CREATE TABLE email_otp_verifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    user_id BIGINT NULL,
    otp_hash VARCHAR(64) NOT NULL,
    salt VARCHAR(32) NOT NULL,
    purpose VARCHAR(30) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    resend_count INT NOT NULL DEFAULT 0,
    max_resends INT NOT NULL DEFAULT 5,
    last_sent_at DATETIME(6) NOT NULL,
    verified_at DATETIME(6) NULL,
    grant_hash VARCHAR(64) NULL,
    grant_expires_at DATETIME(6) NULL,
    consumed_at DATETIME(6) NULL,
    ip_hash VARCHAR(64) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,

    CONSTRAINT fk_email_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_email_otp_lookup (email, purpose, consumed_at, expires_at),
    INDEX idx_email_otp_grant (grant_hash, consumed_at),
    INDEX idx_email_otp_rate_limit (email, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
