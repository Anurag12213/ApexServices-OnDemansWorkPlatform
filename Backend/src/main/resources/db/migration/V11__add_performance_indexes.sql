-- ===================================================================
-- ApexServices Database Migration V11
-- High-Performance Composite Indexes for Dashboards and Feeds
-- Target Engine: MySQL 8.0 (InnoDB)
-- ===================================================================

-- 1. Composite index for customer work requests history queries (customer_email + created_at)
CREATE INDEX idx_wr_customer_created ON work_requests (customer_email, created_at DESC);

-- 2. Composite index for partner active jobs and claims (assigned_partner_id + status + created_at)
CREATE INDEX idx_wr_partner_status_created ON work_requests (assigned_partner_id, status, created_at DESC);

-- 3. Index for partner document type searches and audits
CREATE INDEX idx_partner_docs_type ON partner_documents (document_type);
