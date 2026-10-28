-- ===================================================================
-- ApexServices Database Migration V4
-- Work Requests, Dispatch Broadcasts, and Partner Rejections Schema
-- ===================================================================

CREATE TABLE IF NOT EXISTS work_requests (
    id VARCHAR(50) NOT NULL,
    customer_id BIGINT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NULL,
    contact_phone VARCHAR(50) NULL,
    service_category VARCHAR(100) NOT NULL,
    service_address TEXT NOT NULL,
    problem_title VARCHAR(200) NULL,
    problem_description TEXT NOT NULL,
    photo_url LONGTEXT NULL,
    urgency VARCHAR(50) NOT NULL DEFAULT 'Standard',
    preferred_date VARCHAR(50) NULL,
    preferred_time VARCHAR(50) NULL,
    estimated_cost DECIMAL(10, 2) NOT NULL DEFAULT 499.00,
    
    status ENUM(
        'BROADCASTED',
        'ASSIGNED',
        'IN_TRANSIT',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'EXPIRED'
    ) NOT NULL DEFAULT 'BROADCASTED',

    assigned_partner_id BIGINT NULL,
    assigned_partner_name VARCHAR(100) NULL,
    assigned_partner_phone VARCHAR(50) NULL,
    assigned_partner_rating VARCHAR(50) NULL,
    assigned_partner_photo LONGTEXT NULL,

    stage INT NOT NULL DEFAULT 1,
    version BIGINT NOT NULL DEFAULT 0,

    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    expires_at DATETIME(6) NULL,
    claimed_at DATETIME(6) NULL,
    completed_at DATETIME(6) NULL,

    PRIMARY KEY (id),
    KEY idx_wr_status (status),
    KEY idx_wr_category (service_category),
    KEY idx_wr_customer_email (customer_email),
    KEY idx_wr_assigned_partner (assigned_partner_id),
    KEY idx_wr_expires_at (expires_at),

    CONSTRAINT fk_wr_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_wr_assigned_partner FOREIGN KEY (assigned_partner_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS work_request_rejections (
    id BIGINT NOT NULL AUTO_INCREMENT,
    work_request_id VARCHAR(50) NOT NULL,
    partner_id BIGINT NOT NULL,
    rejected_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),
    UNIQUE KEY uk_rejection_request_partner (work_request_id, partner_id),
    CONSTRAINT fk_rejection_request FOREIGN KEY (work_request_id) REFERENCES work_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_rejection_partner FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS work_request_broadcasts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    work_request_id VARCHAR(50) NOT NULL,
    partner_id BIGINT NOT NULL,
    notified_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),
    UNIQUE KEY uk_broadcast_request_partner (work_request_id, partner_id),
    CONSTRAINT fk_broadcast_request FOREIGN KEY (work_request_id) REFERENCES work_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_broadcast_partner FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE
);
