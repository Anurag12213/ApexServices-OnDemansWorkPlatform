-- ===================================================================
-- ApexServices Database Migration V6
-- Add Payment and Settlement Fields to Work Requests
-- ===================================================================

ALTER TABLE work_requests
    ADD COLUMN payment_status VARCHAR(50) NOT NULL DEFAULT 'UNPAID',
    ADD COLUMN paid_at DATETIME(6) NULL,
    ADD COLUMN paid_amount DECIMAL(10, 2) NULL,
    ADD COLUMN platform_fee DECIMAL(10, 2) NULL,
    ADD COLUMN partner_net_earning DECIMAL(10, 2) NULL,
    ADD COLUMN payment_method VARCHAR(50) NULL;
