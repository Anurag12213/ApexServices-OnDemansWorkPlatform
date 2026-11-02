# ApexServices — API & Ecosystem Documentation

## 1. Authentication & Security
Base URL: `/api`

### Auth & Sessions
- `POST /api/auth/login`: Authenticate user; returns JWT token, user details, and roles.
- `POST /api/auth/register`: Register customer or partner with email verification validation.
- `POST /api/auth/logout`: Revokes current user session and blacklists token.
- `GET /api/auth/me`: Fetch authenticated user profile.

---

## 2. Admin Management Endpoints (`/api/admin/*`)
Requires `ROLE_ADMIN` authorization.

### User Management
- `GET /api/admin/users`: List all ecosystem users with role and status filters.
- `DELETE /api/admin/users/{id}`: Soft-delete user (`deleted_at = NOW()`), immediately terminates active sessions and partner presence.
- `POST /api/admin/users/{id}/restore`: Restores soft-deleted user.

### Partner / Vendor Management
- `GET /api/admin/partners`: List all partners with KYC document attachments.
- `POST /api/admin/partners/{id}/verify-doc`: Review partner KYC document (`VERIFIED` or `REJECTED`).
- `POST /api/admin/partners/{id}/status`: Toggle partner active/suspended status with presence eviction.

### Orders & Bookings
- `GET /api/admin/orders`: List all customer work requests and service bookings.
- `PATCH /api/admin/orders/{id}/status`: Administrative status override; broadcasts STOMP event to `/topic/order-updates/{id}`.

### Support Tickets & Disputes
- `GET /api/admin/tickets`: List omnichannel tickets and customer disputes.
- `POST /api/admin/tickets/{id}/reply`: Send administrative reply to ticket.
- `PATCH /api/admin/tickets/{id}/resolve`: Mark ticket as resolved.

### Coupons & Discounts
- `GET /api/admin/coupons`: List all promotional codes.
- `POST /api/admin/coupons`: Create new promotional coupon with min order and usage caps.
- `PATCH /api/admin/coupons/{id}/status`: Toggle coupon active/inactive.
- `DELETE /api/admin/coupons/{id}`: Delete coupon code.

### Payments, Payouts & Refunds
- `GET /api/admin/payments/payouts`: List partner payout requests.
- `POST /api/admin/payments/payouts/{id}/action`: Action payout (`APPROVE`, `SETTLE`, `REJECT`).
- `GET /api/admin/payments/refunds`: List customer refund requests.
- `POST /api/admin/payments/refunds/{id}/action`: Action refund (`APPROVE`, `SETTLE`, `REJECT`).

### Feature Flags & Configuration
- `GET /api/admin/feature-flags`: Retrieve all system feature flags.
- `PATCH /api/admin/feature-flags/{key}`: Toggle individual feature flag.
- `PUT /api/admin/feature-flags`: Bulk synchronize feature flags and operational configurations.

### Force Update & Version Control
- `GET /api/admin/version-control`: Get version requirements for all platforms.
- `PUT /api/admin/version-control`: Bulk update version requirements and maintenance modes.
- `PUT /api/admin/version-control/{clientType}`: Update single platform version requirements.

### Content Moderation
- `GET /api/admin/moderation/reviews`: List reviews with satisfaction flags.
- `PATCH /api/admin/moderation/reviews/{id}`: Approve or reject review.
- `GET /api/admin/moderation/proofs`: List technician before/after job completion photos.
- `PATCH /api/admin/moderation/proofs/{id}`: Audit and verify job completion photos.

### Sessions & Devices
- `GET /api/admin/sessions`: List all active user sessions across the ecosystem.
- `DELETE /api/admin/sessions/{id}`: Revoke single device session.

### Analytics Overview
- `GET /api/admin/analytics/overview`: Aggregate revenue, platform commissions, active partners, and order volume.

---

## 3. Client & Cross-Portal Public Endpoints

### Coupons (Customer Portal)
- `POST /api/coupons/validate`: Validate coupon code against cart amount and user limit. Returns calculated discount.

### Support Tickets (Customer & Partner Portals)
- `GET /api/tickets/my`: Retrieve tickets created by the authenticated user.
- `POST /api/tickets`: Create new support ticket or dispute.

### Partner Documents (Partner Portal)
- `GET /api/partners/documents`: Retrieve partner's uploaded KYC documents.
- `POST /api/partners/documents/upload`: Upload new identification or certification document.

### Public Runtime Configuration (All Portals)
- `GET /api/config/public-flags`: Retrieve active feature flags for client conditional rendering.
- `GET /api/config/version-check?client={client}&currentVersion={v}`: Check version compatibility and maintenance lockdown.
