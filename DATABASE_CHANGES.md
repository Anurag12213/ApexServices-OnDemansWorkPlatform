# ApexServices — Database Migration & Schema Changes

## Authoritative Database Engine
- **Engine**: MySQL 8.4
- **Host**: Aiven Cloud
- **Migration Manager**: Flyway (`org.flywaydb:flyway-core`)

---

## Applied Migration: `V10__normalize_admin_ecosystem_entities.sql`
Executed successfully on Aiven MySQL: `2026-11-02T21:18:54+05:30` (Execution time: 04.212s).

### 1. `users` Table Alteration
```sql
ALTER TABLE users ADD COLUMN deleted_at DATETIME(6) NULL;
```
Enables non-destructive soft-deletion for customer and partner accounts. Suspended/soft-deleted users are prevented from authenticating or claiming orders.

### 2. New Relational Tables

#### `support_tickets`
- `id` (VARCHAR 50, PRIMARY KEY)
- `user_id` (BIGINT, FK to `users.id`)
- `user_email`, `customer_name`, `customer_phone`
- `category` (VARCHAR 50)
- `priority` (VARCHAR 20: LOW, MEDIUM, HIGH, URGENT)
- `status` (VARCHAR 20: OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- `subject` (VARCHAR 255), `description` (TEXT), `related_order_id` (VARCHAR 50)
- `created_at`, `updated_at`

#### `ticket_messages`
- `id` (BIGINT AUTO_INCREMENT, PRIMARY KEY)
- `ticket_id` (VARCHAR 50, FK to `support_tickets.id`)
- `sender_id` (BIGINT, NULLABLE)
- `sender_name` (VARCHAR 100), `is_staff` (BOOLEAN)
- `message_text` (TEXT), `created_at` (DATETIME(6))

#### `coupons`
- `code` (VARCHAR 50, PRIMARY KEY)
- `discount_type` (VARCHAR 20: PERCENTAGE, FIXED)
- `discount_value` (DECIMAL 10,2), `min_order_value` (DECIMAL 10,2), `max_discount_cap` (DECIMAL 10,2)
- `max_redemptions` (INT), `current_redemptions` (INT)
- `valid_until` (DATETIME(6)), `status` (VARCHAR 20)
- `applicable_category` (VARCHAR 100), `created_at`, `updated_at`

#### `coupon_redemptions`
- `id` (BIGINT AUTO_INCREMENT, PRIMARY KEY)
- `coupon_code` (VARCHAR 50, FK to `coupons.code`)
- `user_id` (BIGINT, FK to `users.id`)
- `work_request_id` (VARCHAR 50), `discount_applied` (DECIMAL 10,2), `redeemed_at` (DATETIME(6))

#### `partner_documents`
- `id` (BIGINT AUTO_INCREMENT, PRIMARY KEY)
- `partner_id` (BIGINT, FK to `users.id`)
- `document_type` (VARCHAR 50), `document_name` (VARCHAR 255), `document_url` (TEXT)
- `status` (VARCHAR 20: PENDING_REVIEW, VERIFIED, REJECTED)
- `rejection_reason` (TEXT), `uploaded_at` (DATETIME(6)), `reviewed_at` (DATETIME(6))

#### `partner_payouts`
- `id` (VARCHAR 50, PRIMARY KEY)
- `partner_id` (BIGINT, FK to `users.id`)
- `amount` (DECIMAL 10,2), `status` (VARCHAR 30: PENDING_APPROVAL, APPROVED, SETTLED, REJECTED)
- `payout_method` (VARCHAR 50), `payout_destination` (VARCHAR 255), `transaction_reference` (VARCHAR 100)
- `requested_at` (DATETIME(6)), `processed_at` (DATETIME(6))

#### `customer_refunds`
- `id` (VARCHAR 50, PRIMARY KEY)
- `customer_id` (BIGINT, FK to `users.id`)
- `work_request_id` (VARCHAR 50)
- `amount` (DECIMAL 10,2), `status` (VARCHAR 30: PENDING_APPROVAL, APPROVED, SETTLED, REJECTED)
- `reason` (VARCHAR 255), `transaction_reference` (VARCHAR 100)
- `requested_at` (DATETIME(6)), `processed_at` (DATETIME(6))

#### `audit_logs`
- `id` (VARCHAR 50, PRIMARY KEY)
- `actor_id` (VARCHAR 100), `actor_role` (VARCHAR 50), `action` (VARCHAR 100)
- `entity_type` (VARCHAR 50), `entity_id` (VARCHAR 100), `details` (TEXT), `ip_address` (VARCHAR 50), `created_at` (DATETIME(6))

#### `platform_feature_flags`
- `flag_key` (VARCHAR 100, PRIMARY KEY)
- `flag_name` (VARCHAR 150), `description` (TEXT), `category` (VARCHAR 50)
- `is_enabled` (BOOLEAN), `is_public` (BOOLEAN), `updated_at` (DATETIME(6))

#### `app_versions`
- `client_type` (VARCHAR 50, PRIMARY KEY: `customer_web`, `partner_web`, `android_app`, `ios_app`)
- `client_name` (VARCHAR 100), `current_version` (VARCHAR 30), `min_required_version` (VARCHAR 30)
- `force_update_enabled` (BOOLEAN), `maintenance_mode` (BOOLEAN)
- `prompt_title` (VARCHAR 255), `prompt_message` (TEXT), `updated_at` (DATETIME(6))

#### `user_sessions`
- `id` (VARCHAR 100, PRIMARY KEY)
- `user_id` (BIGINT, FK to `users.id`), `user_email` (VARCHAR 255), `role` (VARCHAR 50)
- `device_info` (VARCHAR 255), `browser` (VARCHAR 100), `ip_address` (VARCHAR 50)
- `is_revoked` (BOOLEAN), `last_active_at` (DATETIME(6)), `created_at` (DATETIME(6))
