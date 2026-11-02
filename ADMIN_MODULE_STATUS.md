# ApexServices — Admin Panel 16 Module Status Matrix

This matrix documents the verification and operational status of all 16 modules in the ApexServices Admin Panel.

| Module | Module Name | Backend APIs & Services | Database Entity | Multi-Portal Integration | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A** | **User Management** | `GET/DELETE/POST /api/admin/users/*` | `User` (`deleted_at`), `UserSession` | Soft-deletion and restoration with immediate session eviction. | **Verified** |
| **B** | **Content Management (CMS)** | `GET/PUT /api/admin/settings`, `/api/data` | `SiteSetting`, `Category` | Dynamic hero slides, branding logos, and announcements reflect on Customer and Partner portals. | **Verified** |
| **C** | **Payments & Transactions** | `GET/POST /api/admin/payments/*` | `PartnerPayout`, `CustomerRefund`, `WorkRequest` | Strict separation of approval and settlement states; no fake financial transactions. | **Verified** |
| **D** | **Promotions & Coupons** | `GET/POST/DELETE /api/admin/coupons/*` | `Coupon`, `CouponRedemption` | Validated by Customer checkout (`POST /api/coupons/validate`) with expiry and limits. | **Verified** |
| **E** | **Support Tickets & Disputes** | `GET/POST/PATCH /api/admin/tickets/*` | `SupportTicket`, `TicketMessage` | Customer disputes submitted from work requests create tickets in real-time. | **Verified** |
| **F** | **Partner / Vendor Management** | `GET/POST /api/admin/partners/*` | `User`, `PartnerDocument` | Partner KYC uploads in field portal trigger admin review queue; suspension clears partner presence. | **Verified** |
| **G** | **Orders & Bookings** | `GET/PATCH /api/admin/orders/*`, `/work-requests` | `WorkRequest`, `WorkRequestEvent` | Real-time STOMP WebSocket broadcast upon manual administrative order status override. | **Verified** |
| **H** | **Service Catalog & Pricing** | `GET/POST/PUT /api/categories/*`, `/services/*` | `Category`, `ServiceItem` | Category activation toggles enforce backend guards against booking deactivated services. | **Verified** |
| **I** | **Audit Logs & Activity History** | `GET /api/admin/audit-logs` | `AuditLog` | Centralized immutable audit trails for sensitive financial and governance operations. | **Verified** |
| **J** | **Reports & Business Exports** | `GET /api/admin/analytics/overview` | Dynamic aggregate queries | CSV exports generated with genuine calculations and real financial metrics. | **Verified** |
| **K** | **Roles & Permissions (RBAC)** | `SecurityConfig`, `AdminController` | `User` (`role`), `Role` | Restrictive backend authorization on all administrative paths; URL tampering prevented. | **Verified** |
| **L** | **Platform Configuration** | `GET/PUT /api/admin/feature-flags` | `PlatformFeatureFlag` | Runtime public config endpoint (`/api/config/public-flags`) synchronizes client features. | **Verified** |
| **M** | **Platform Analytics** | `GET /api/admin/analytics/overview` | `WorkRequest`, `User` | Live aggregate revenue, commission fees, and partner earnings calculation. | **Verified** |
| **N** | **Content Moderation** | `GET/PATCH /api/admin/moderation/*` | `Review`, `WorkRequest` | Customer ratings QA moderation and job completion proof photo verification. | **Verified** |
| **O** | **Session & Device Security** | `GET/DELETE /api/admin/sessions/*` | `UserSession` | Token invalidation and remote session termination across web and mobile clients. | **Verified** |
| **P** | **App Versioning & Force-Update**| `GET/PUT /api/admin/version-control` | `AppVersion` | Real-time version check (`/api/config/version-check`) for maintenance mode and updates. | **Verified** |

---

### Architectural Clarification: Notifications Handling
As mandated in Section 4 of the architectural requirements, there is **NO standalone Notifications tab** in the Admin Panel sidebar. All broadcast events, administrative notifications, security alerts, and system mutations are unified under **Module I: Audit Logs & Activity History**, preventing fragmentation and redundancy.
