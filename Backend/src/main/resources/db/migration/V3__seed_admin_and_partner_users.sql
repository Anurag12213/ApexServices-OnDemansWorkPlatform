-- ===================================================================
-- ApexServices Database Migration V3
-- Seed Initial Controlled Administrator and Partner Accounts
-- ===================================================================

INSERT INTO users (full_name, email, mobile_number, password, provider, role, active, created_at, updated_at)
VALUES (
    'Apex Super Administrator',
    'admin@apexservices.com',
    '9999999999',
    '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.',
    'LOCAL',
    'ROLE_ADMIN',
    1,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE 
    role = 'ROLE_ADMIN',
    active = 1,
    updated_at = NOW();

INSERT INTO users (full_name, email, mobile_number, password, provider, role, active, created_at, updated_at)
VALUES (
    'Apex Certified Partner',
    'partner@apexservices.com',
    '9123456780',
    '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.',
    'LOCAL',
    'ROLE_PARTNER',
    1,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE 
    role = 'ROLE_PARTNER',
    active = 1,
    updated_at = NOW();
