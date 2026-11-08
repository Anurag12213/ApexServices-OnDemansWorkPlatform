-- ===================================================================
-- ApexServices Database Migration V15
-- Work Request Post and Pick Model Rebuild & Lifecycle Extensions
-- ===================================================================

-- 1. Add geospatial coordinates and granular location fields to work_requests
ALTER TABLE work_requests
    ADD COLUMN latitude DECIMAL(10, 7) NULL AFTER service_address,
    ADD COLUMN longitude DECIMAL(10, 7) NULL AFTER latitude,
    ADD COLUMN house_details VARCHAR(200) NULL AFTER longitude,
    ADD COLUMN landmark VARCHAR(200) NULL AFTER house_details,
    ADD COLUMN city_postal VARCHAR(100) NULL AFTER landmark;

-- 2. Add quotation, stage timestamps, and dispute tracking fields
ALTER TABLE work_requests
    ADD COLUMN quote_amount DECIMAL(10, 2) NULL AFTER estimated_cost,
    ADD COLUMN quote_notes TEXT NULL AFTER quote_amount,
    ADD COLUMN cancellation_reason TEXT NULL AFTER completed_at,
    ADD COLUMN cancelled_by_role VARCHAR(50) NULL AFTER cancellation_reason,
    ADD COLUMN cancelled_at DATETIME(6) NULL AFTER cancelled_by_role,
    ADD COLUMN dispute_reason TEXT NULL AFTER cancelled_at,
    ADD COLUMN disputed_at DATETIME(6) NULL AFTER dispute_reason,
    ADD COLUMN started_journey_at DATETIME(6) NULL AFTER disputed_at,
    ADD COLUMN arrived_at DATETIME(6) NULL AFTER started_journey_at,
    ADD COLUMN started_work_at DATETIME(6) NULL AFTER arrived_at;

-- 3. Add composite performance index for Post and Pick marketplace queries
CREATE INDEX idx_wr_post_and_pick ON work_requests (status, service_category_id, created_at DESC);
CREATE INDEX idx_wr_geo ON work_requests (latitude, longitude);

-- 4. Map legacy BROADCASTED requests to POSTED for the Post and Pick model
UPDATE work_requests
SET status = 'POSTED'
WHERE status = 'BROADCASTED';
