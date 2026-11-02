-- ===================================================================
-- ApexServices Database Migration V10
-- Normalize Admin Ecosystem: Tickets, Coupons, Payouts, Refunds, 
-- Partner Documents, Audit Logs, Feature Flags, Version Control, Sessions
-- ===================================================================

-- 1. Soft-Delete support on users table
ALTER TABLE users ADD COLUMN deleted_at DATETIME(6) NULL;

-- 2. Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    id VARCHAR(50) NOT NULL,
    user_id BIGINT NULL,
    user_type VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NULL,
    customer_phone VARCHAR(50) NULL,
    work_request_id VARCHAR(50) NULL,
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'GENERAL',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    assigned_to VARCHAR(100) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_tickets_user (user_id, status),
    INDEX idx_tickets_work_request (work_request_id),
    INDEX idx_tickets_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Ticket Messages Conversation Table
CREATE TABLE IF NOT EXISTS ticket_messages (
    id BIGINT AUTO_INCREMENT NOT NULL,
    ticket_id VARCHAR(50) NOT NULL,
    sender_id BIGINT NULL,
    sender_name VARCHAR(100) NOT NULL,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    message_text TEXT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_ticket_messages (ticket_id, created_at),
    CONSTRAINT fk_ticket_messages_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Coupons & Discounts Table
CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    discount_type VARCHAR(20) NOT NULL, -- PERCENTAGE, FLAT
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    max_discount_cap DECIMAL(10, 2) NULL,
    total_redemptions INT NOT NULL DEFAULT 0,
    max_redemptions INT NULL,
    per_user_limit INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PAUSED, EXPIRED
    applicable_category VARCHAR(100) NULL DEFAULT 'All Services',
    valid_from DATETIME(6) NULL,
    valid_until DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_coupon_code (code),
    INDEX idx_coupon_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Coupon Redemptions Table
CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id BIGINT AUTO_INCREMENT NOT NULL,
    coupon_id VARCHAR(50) NOT NULL,
    user_id BIGINT NULL,
    customer_phone VARCHAR(50) NULL,
    work_request_id VARCHAR(50) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    redeemed_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_redemption_order (coupon_id, work_request_id),
    INDEX idx_redemption_user (user_id),
    CONSTRAINT fk_redemption_coupon FOREIGN KEY (coupon_id) REFERENCES coupons (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Partner KYC Documents Table
CREATE TABLE IF NOT EXISTS partner_documents (
    id VARCHAR(50) NOT NULL,
    partner_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_name VARCHAR(150) NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, VERIFIED, REJECTED
    rejection_reason VARCHAR(500) NULL,
    verified_by VARCHAR(100) NULL,
    verified_at DATETIME(6) NULL,
    uploaded_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_partner_docs (partner_id, status),
    CONSTRAINT fk_partner_docs_user FOREIGN KEY (partner_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Partner Financial Payouts Ledger
CREATE TABLE IF NOT EXISTS partner_payouts (
    id VARCHAR(50) NOT NULL,
    partner_id BIGINT NOT NULL,
    partner_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    payout_method VARCHAR(50) NOT NULL DEFAULT 'BANK_TRANSFER',
    account_number VARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, PROCESSING, SETTLED, REJECTED
    transaction_reference VARCHAR(100) NULL,
    approved_by VARCHAR(100) NULL,
    notes TEXT NULL,
    created_at DATETIME(6) NOT NULL,
    settled_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    INDEX idx_partner_payouts (partner_id, status),
    CONSTRAINT fk_partner_payouts_user FOREIGN KEY (partner_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Customer Refunds Ledger
CREATE TABLE IF NOT EXISTS customer_refunds (
    id VARCHAR(50) NOT NULL,
    work_request_id VARCHAR(50) NOT NULL,
    customer_id BIGINT NULL,
    customer_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED', -- REQUESTED, APPROVED, PROCESSING, SETTLED, REJECTED
    processed_by VARCHAR(100) NULL,
    transaction_reference VARCHAR(100) NULL,
    created_at DATETIME(6) NOT NULL,
    settled_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    INDEX idx_customer_refunds (work_request_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Central Immutable Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) NOT NULL,
    actor_id VARCHAR(100) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT NULL,
    ip_address VARCHAR(50) NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Platform Feature Flags & Configuration
CREATE TABLE IF NOT EXISTS platform_feature_flags (
    flag_key VARCHAR(100) NOT NULL,
    flag_name VARCHAR(150) NOT NULL,
    description VARCHAR(255) NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (flag_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Application Versions & Gates Table
CREATE TABLE IF NOT EXISTS app_versions (
    client_type VARCHAR(50) NOT NULL, -- customer_web, partner_web, admin_web
    client_name VARCHAR(100) NOT NULL,
    current_version VARCHAR(20) NOT NULL,
    min_required_version VARCHAR(20) NOT NULL,
    force_update_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
    prompt_title VARCHAR(150) NULL,
    prompt_message VARCHAR(500) NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (client_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Active User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(100) NOT NULL,
    user_id BIGINT NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    device_info VARCHAR(255) NULL,
    browser VARCHAR(100) NULL,
    ip_address VARCHAR(50) NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    last_active_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_user_sessions (user_id, is_revoked),
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Default Feature Flags
INSERT INTO platform_feature_flags (flag_key, flag_name, description, is_enabled, category, is_public, updated_at)
VALUES 
('instant_booking_enabled', '1-Click Instant Booking', 'Allow customer to book without prior technician quote', TRUE, 'Customer Experience', TRUE, NOW(6)),
('surge_pricing_enabled', 'Dynamic Surge Pricing', 'Apply multiplier during peak slots', FALSE, 'Revenue', TRUE, NOW(6)),
('partner_phone_otp_required', 'Mandatory Phone OTP', 'Enforce 6-digit SMS OTP on partner login', TRUE, 'Security', TRUE, NOW(6)),
('ai_smart_dispatch', 'AI Geolocation Dispatch', 'Ranks fleet by distance and customer rating', TRUE, 'Automation', FALSE, NOW(6))
ON DUPLICATE KEY UPDATE updated_at = NOW(6);

-- Seed Default App Version Gates
INSERT INTO app_versions (client_type, client_name, current_version, min_required_version, force_update_enabled, maintenance_mode, prompt_title, prompt_message, updated_at)
VALUES
('customer_web', 'Customer Web Portal', '2.1.0', '2.0.0', TRUE, FALSE, 'Experience Upgrade Available', 'Please refresh your browser for the latest platform updates.', NOW(6)),
('partner_web', 'Technician Field Web App', '2.0.4', '1.9.0', TRUE, FALSE, 'Field Dispatch Update', 'Critical dispatch synchronization patch.', NOW(6))
ON DUPLICATE KEY UPDATE updated_at = NOW(6);
