-- ===================================================================
-- ApexServices Database Migration V5
-- Service Categories, Organizations, and Strict Partner Eligibility
-- ===================================================================

-- 1. Extend categories table with slug and active status
ALTER TABLE categories ADD COLUMN slug VARCHAR(100) NULL AFTER name;
ALTER TABLE categories ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE AFTER tag;

-- Populate slugs for existing seeded categories
UPDATE categories SET slug = 'custom-carpentry' WHERE id = 1;
UPDATE categories SET slug = 'emergency-plumbing' WHERE id = 2;
UPDATE categories SET slug = 'electrical-maintenance' WHERE id = 3;
UPDATE categories SET slug = 'painting-decor' WHERE id = 4;
UPDATE categories SET slug = 'hvac-ac-service' WHERE id = 5;
UPDATE categories SET slug = 'appliance-care' WHERE id = 6;
UPDATE categories SET slug = 'smart-home-automation' WHERE id = 8;
UPDATE categories SET slug = 'custom-solar-roofing' WHERE id = 9;
UPDATE categories SET slug = 'solar-panel-cleaning' WHERE id = 10;
UPDATE categories SET slug = LOWER(REPLACE(REPLACE(REPLACE(name, ' & ', '-'), ' ', '-'), '/', '-')) WHERE slug IS NULL;

-- Enforce slug constraints
ALTER TABLE categories MODIFY COLUMN slug VARCHAR(100) NOT NULL;
ALTER TABLE categories ADD CONSTRAINT uk_categories_slug UNIQUE (slug);
ALTER TABLE categories ADD KEY idx_categories_active (active);

-- 2. Seed Deep Cleaning and Pest Control categories
INSERT INTO categories (name, slug, description, tag, active, icon_id) VALUES
('Deep Cleaning', 'deep-cleaning', 'Comprehensive residential and commercial sanitization, scrubbing, and carpet care.', 'Popular', 1, 7),
('Pest Control', 'pest-control', 'Eco-friendly pest management, termite inspection, and fumigation treatments.', 'Certified', 1, 18)
ON DUPLICATE KEY UPDATE 
    slug = VALUES(slug),
    active = VALUES(active);

-- 3. Create Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    business_license VARCHAR(100) NULL,
    contact_email VARCHAR(255) NULL,
    contact_phone VARCHAR(50) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE KEY uk_org_name (name)
);

-- Seed Initial Verified Service Organization
INSERT INTO organizations (id, name, business_license, contact_email, contact_phone, active)
VALUES (1, 'Apex Craft Solutions LLP', 'LIC-MH-2026-9812', 'craft.solutions@apexservices.com', '9820011223', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 4. Extend users table for partner type and organization association
ALTER TABLE users ADD COLUMN partner_type VARCHAR(50) NOT NULL DEFAULT 'INDIVIDUAL';
ALTER TABLE users ADD COLUMN organization_id BIGINT NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

-- 5. Create Partner Service Categories Join Table (Authoritative eligibility)
CREATE TABLE IF NOT EXISTS partner_service_categories (
    partner_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (partner_id, category_id),
    CONSTRAINT fk_psc_partner FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_psc_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 6. Extend work_requests with authoritative foreign key to categories
ALTER TABLE work_requests ADD COLUMN service_category_id BIGINT NULL AFTER service_category;
ALTER TABLE work_requests ADD KEY idx_wr_service_category_id (service_category_id);
ALTER TABLE work_requests ADD CONSTRAINT fk_wr_category_id FOREIGN KEY (service_category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Backfill service_category_id on existing work_requests
UPDATE work_requests wr
JOIN categories c ON (c.name = wr.service_category OR c.slug = wr.service_category)
SET wr.service_category_id = c.id
WHERE wr.service_category_id IS NULL;

-- 7. Seed Real Customers (BCrypt hash for password123)
INSERT INTO users (full_name, email, mobile_number, password, provider, role, active, created_at, updated_at)
VALUES 
('Ananya Sharma', 'ananya@apexservices.com', '9811122233', '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.', 'LOCAL', 'ROLE_CUSTOMER', 1, NOW(), NOW()),
('Rohan Verma', 'rohan@apexservices.com', '9822233344', '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.', 'LOCAL', 'ROLE_CUSTOMER', 1, NOW(), NOW()),
('Pooja Mehta', 'pooja@apexservices.com', '9833344455', '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.', 'LOCAL', 'ROLE_CUSTOMER', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE active = 1;

-- 8. Seed Distinct Trade Partners (Individual & Organization Members)
-- Partner 1: Rajesh Sharma (Carpentry)
UPDATE users SET full_name = 'Rajesh Sharma', partner_type = 'INDIVIDUAL' WHERE email = 'partner@apexservices.com';

INSERT INTO users (full_name, email, mobile_number, password, provider, role, partner_type, active, created_at, updated_at)
VALUES 
('Rajesh Sharma', 'rajesh.carpenter@apexservices.com', '9823411200', '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.', 'LOCAL', 'ROLE_PARTNER', 'INDIVIDUAL', 1, NOW(), NOW()),
-- Partner 2: Vikram Patel (Plumbing)
('Vikram Patel', 'vikram.plumber@apexservices.com', '9823411201', '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.', 'LOCAL', 'ROLE_PARTNER', 'INDIVIDUAL', 1, NOW(), NOW()),
-- Partner 3: Amit Verma (Electrical)
('Amit Verma', 'amit.electrician@apexservices.com', '9823411202', '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.', 'LOCAL', 'ROLE_PARTNER', 'INDIVIDUAL', 1, NOW(), NOW()),
-- Partner 4: Sunita Rao (Painting)
('Sunita Rao', 'sunita.painting@apexservices.com', '9823411203', '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.', 'LOCAL', 'ROLE_PARTNER', 'INDIVIDUAL', 1, NOW(), NOW()),
-- Organization Partner Members (Associated with Apex Craft Solutions LLP id=1)
('Suresh Kumar', 'suresh.org@apexservices.com', '9823411204', '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.', 'LOCAL', 'ROLE_PARTNER', 'ORG_MEMBER', 1, NOW(), NOW()),
('Deepak Yadav', 'deepak.org@apexservices.com', '9823411205', '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.', 'LOCAL', 'ROLE_PARTNER', 'ORG_MEMBER', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE active = 1;

-- Link Org Members to Organization id 1
UPDATE users SET organization_id = 1 WHERE email IN ('suresh.org@apexservices.com', 'deepak.org@apexservices.com');

-- 9. Authoritative Category Assignments (partner_service_categories)
-- partner@apexservices.com & rajesh.carpenter@apexservices.com -> Custom Carpentry (id 1)
INSERT IGNORE INTO partner_service_categories (partner_id, category_id)
SELECT u.id, 1 FROM users u WHERE u.email IN ('partner@apexservices.com', 'rajesh.carpenter@apexservices.com');

-- vikram.plumber@apexservices.com -> Emergency Plumbing (id 2)
INSERT IGNORE INTO partner_service_categories (partner_id, category_id)
SELECT u.id, 2 FROM users u WHERE u.email = 'vikram.plumber@apexservices.com';

-- amit.electrician@apexservices.com -> Electrical Maintenance (id 3)
INSERT IGNORE INTO partner_service_categories (partner_id, category_id)
SELECT u.id, 3 FROM users u WHERE u.email = 'amit.electrician@apexservices.com';

-- sunita.painting@apexservices.com -> Painting & Decor (id 4)
INSERT IGNORE INTO partner_service_categories (partner_id, category_id)
SELECT u.id, 4 FROM users u WHERE u.email = 'sunita.painting@apexservices.com';

-- Suresh Kumar & Deepak Yadav (Org Members) -> Custom Carpentry (1) AND Emergency Plumbing (2)
INSERT IGNORE INTO partner_service_categories (partner_id, category_id)
SELECT u.id, 1 FROM users u WHERE u.email IN ('suresh.org@apexservices.com', 'deepak.org@apexservices.com');

INSERT IGNORE INTO partner_service_categories (partner_id, category_id)
SELECT u.id, 2 FROM users u WHERE u.email IN ('suresh.org@apexservices.com', 'deepak.org@apexservices.com');

-- 10. Create Database View service_categories for compatibility
CREATE OR REPLACE VIEW service_categories AS
SELECT id, name, slug, description, tag, active, icon_id, created_at, updated_at
FROM categories;
