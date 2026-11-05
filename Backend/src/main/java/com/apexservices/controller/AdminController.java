package com.apexservices.controller;

import com.apexservices.model.*;
import com.apexservices.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://apexservices-admin-portal.netlify.app", "https://apexservicesondemand.netlify.app", "https://apexservices-partner-portal.netlify.app"})
public class AdminController {

    private final AdminService adminService;
    private final TicketService ticketService;
    private final CouponService couponService;
    private final PartnerManagementService partnerManagementService;
    private final CustomerRefundService customerRefundService;
    private final PlatformConfigService platformConfigService;
    private final AuditLogService auditLogService;
    private final UserSessionService userSessionService;
    private final AdminAnalyticsService adminAnalyticsService;
    private final ContentVersionService contentVersionService;

    // =========================================================================
    // 1. USER MANAGEMENT (/api/admin/users)
    // =========================================================================
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> req, Principal principal) {
        try {
            String actor = principal != null ? principal.getName() : "ADMIN";
            Map<String, Object> res = adminService.createUser(req, actor);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id, Principal principal) {
        String actor = principal != null ? principal.getName() : "ADMIN";
        return adminService.toggleUserStatus(id, actor)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> softDeleteUser(@PathVariable Long id, Principal principal) {
        String actor = principal != null ? principal.getName() : "ADMIN";
        return adminService.softDeleteUser(id, actor)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/users/{id}/restore")
    public ResponseEntity<?> restoreUser(@PathVariable Long id, Principal principal) {
        String actor = principal != null ? principal.getName() : "ADMIN";
        return adminService.restoreUser(id, actor)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // =========================================================================
    // 2. ORDER / BOOKING MANAGEMENT (/api/admin/bookings)
    // =========================================================================
    @GetMapping("/bookings")
    public ResponseEntity<List<Map<String, Object>>> getAllBookings() {
        return ResponseEntity.ok(adminService.getAllBookings());
    }

    @PatchMapping("/bookings/{id}/override")
    public ResponseEntity<?> overrideBookingStatus(@PathVariable String id, @RequestBody Map<String, String> payload, Principal principal) {
        String newStatusStr = payload.get("status");
        String reason = payload.getOrDefault("reason", "Administrative manual override");
        String actor = principal != null ? principal.getName() : "ADMIN";

        return adminService.overrideBookingStatus(id, newStatusStr, reason, actor)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // =========================================================================
    // 3. VENDOR / PARTNER MANAGEMENT (/api/admin/partners)
    // =========================================================================
    @GetMapping("/partners")
    public ResponseEntity<List<Map<String, Object>>> getPartners() {
        return ResponseEntity.ok(adminService.getPartners());
    }

    @PatchMapping("/partners/{id}/status")
    public ResponseEntity<?> togglePartnerStatus(@PathVariable Long id, Principal principal) {
        String actor = principal != null ? principal.getName() : "ADMIN";
        return adminService.togglePartnerStatus(id, actor)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/partners/{id}/documents")
    public ResponseEntity<List<Map<String, Object>>> getPartnerDocuments(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getPartnerDocuments(id));
    }

    @PostMapping("/partners/{id}/verify-doc")
    public ResponseEntity<?> verifyPartnerDoc(
            @PathVariable Long id,
            @RequestBody Map<String, String> req,
            Principal principal
    ) {
        String docId = req.get("docId");
        if (docId == null || docId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "docId is required"));
        }
        String status = req.getOrDefault("status", "VERIFIED");
        String reason = req.get("reason");
        String actor = principal != null ? principal.getName() : "ADMIN";

        try {
            PartnerDocument doc = partnerManagementService.reviewDocument(id, docId, status, reason, actor);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "docId", doc.getId(),
                    "status", doc.getStatus(),
                    "name", doc.getDocumentName(),
                    "type", doc.getDocumentType() != null ? doc.getDocumentType() : "AADHAAR",
                    "rejectionReason", doc.getRejectionReason() != null ? doc.getRejectionReason() : "",
                    "verifiedBy", doc.getVerifiedBy() != null ? doc.getVerifiedBy() : actor,
                    "uploadedAt", "Recent"
            ));
        } catch (Exception e) {
            log.error("Failed to verify partner document {}: {}", docId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // =========================================================================
    // 4. SUPPORT & TICKET MANAGEMENT (/api/admin/tickets)
    // =========================================================================
    @GetMapping("/tickets")
    public ResponseEntity<List<SupportTicket>> getTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @PostMapping("/tickets/{id}/reply")
    public ResponseEntity<?> replyTicket(
            @PathVariable String id,
            @RequestBody Map<String, String> payload,
            Principal principal
    ) {
        String replyText = payload.get("text");
        if (replyText == null || replyText.isBlank()) {
            replyText = payload.get("message");
        }
        if (replyText == null || replyText.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Reply message text is required"));
        }
        String senderName = principal != null ? principal.getName() : "ApexServices Support Desk";

        TicketMessage msg = ticketService.replyTicket(id, null, senderName, true, replyText);
        SupportTicket updatedTicket = ticketService.getTicketById(id).orElse(null);
        return ResponseEntity.ok(Map.of("success", true, "message", msg, "ticket", updatedTicket != null ? updatedTicket : Map.of()));
    }

    @PatchMapping("/tickets/{id}/resolve")
    public ResponseEntity<?> resolveTicket(@PathVariable String id, Principal principal) {
        String actor = principal != null ? principal.getName() : "Admin";
        SupportTicket resolved = ticketService.resolveTicket(id, actor);
        return ResponseEntity.ok(Map.of("success", true, "ticket", resolved));
    }

    // =========================================================================
    // 5. COUPONS & DISCOUNTS (/api/admin/coupons)
    // =========================================================================
    @GetMapping("/coupons")
    public ResponseEntity<List<Coupon>> getCoupons() {
        return ResponseEntity.ok(couponService.getAllCoupons());
    }

    @PostMapping("/coupons")
    public ResponseEntity<?> createCoupon(@RequestBody Map<String, Object> payload, Principal principal) {
        String code = (String) payload.get("code");
        String discountType = (String) payload.getOrDefault("discountType", "PERCENTAGE");
        Number discVal = (Number) payload.getOrDefault("discountValue", 20);
        Number minVal = (Number) payload.getOrDefault("minOrderValue", 0);
        Number capVal = (Number) payload.get("maxDiscountCap");

        Coupon coupon = Coupon.builder()
                .code(code.toUpperCase().trim())
                .discountType(discountType.toUpperCase())
                .discountValue(BigDecimal.valueOf(discVal.doubleValue()))
                .minOrderValue(BigDecimal.valueOf(minVal.doubleValue()))
                .maxDiscountCap(capVal != null ? BigDecimal.valueOf(capVal.doubleValue()) : null)
                .status("ACTIVE")
                .applicableCategory((String) payload.getOrDefault("applicableCategory", "All Services"))
                .build();

        Coupon saved = couponService.createCoupon(coupon, principal != null ? principal.getName() : "ADMIN");
        contentVersionService.bumpVersion();
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/coupons/{id}/status")
    public ResponseEntity<?> toggleCouponStatus(@PathVariable String id, Principal principal) {
        Coupon c = couponService.toggleStatus(id, principal != null ? principal.getName() : "ADMIN");
        contentVersionService.bumpVersion();
        return ResponseEntity.ok(Map.of("success", true, "status", c.getStatus()));
    }

    @DeleteMapping("/coupons/{id}")
    public ResponseEntity<?> deleteCoupon(@PathVariable String id, Principal principal) {
        couponService.deleteCoupon(id, principal != null ? principal.getName() : "ADMIN");
        contentVersionService.bumpVersion();
        return ResponseEntity.ok(Map.of("success", true));
    }

    // =========================================================================
    // 6. PAYMENTS, PAYOUTS & REFUNDS
    // =========================================================================
    @GetMapping("/payments/payouts")
    public ResponseEntity<List<PartnerPayout>> getAllPayouts() {
        return ResponseEntity.ok(partnerManagementService.getAllPayouts());
    }

    @PostMapping("/payments/payouts/{id}/action")
    public ResponseEntity<?> updatePayoutAction(
            @PathVariable String id,
            @RequestBody Map<String, String> req,
            Principal principal
    ) {
        String action = req.getOrDefault("action", "APPROVE");
        String txnRef = req.get("transactionReference");
        String notes = req.get("notes");
        String actor = principal != null ? principal.getName() : "ADMIN";

        PartnerPayout payout = partnerManagementService.updatePayoutStatus(id, action, txnRef, actor, notes);
        return ResponseEntity.ok(payout);
    }

    @GetMapping("/payments/refunds")
    public ResponseEntity<List<CustomerRefund>> getAllRefunds() {
        return ResponseEntity.ok(customerRefundService.getAllRefunds());
    }

    @PostMapping("/payments/refunds/{id}/action")
    public ResponseEntity<?> updateRefundAction(
            @PathVariable String id,
            @RequestBody Map<String, String> req,
            Principal principal
    ) {
        String action = req.getOrDefault("action", "APPROVE");
        String txnRef = req.get("transactionReference");
        String actor = principal != null ? principal.getName() : "ADMIN";

        CustomerRefund refund = customerRefundService.updateRefundStatus(id, action, txnRef, actor);
        return ResponseEntity.ok(refund);
    }

    // =========================================================================
    // 7. FEATURE FLAGS & APP CONFIGURATION (/api/admin/feature-flags)
    // =========================================================================
    @GetMapping("/feature-flags")
    public ResponseEntity<?> getFeatureFlags() {
        List<PlatformFeatureFlag> flags = platformConfigService.getAllFlags();
        Map<String, Object> flagMap = new HashMap<>();
        for (PlatformFeatureFlag f : flags) {
            flagMap.put(f.getFlagKey(), Map.of(
                    "name", f.getFlagName(),
                    "desc", f.getDescription() != null ? f.getDescription() : "",
                    "enabled", f.isEnabled(),
                    "category", f.getCategory() != null ? f.getCategory() : "General"
            ));
        }
        return ResponseEntity.ok(Map.of(
                "flags", flagMap,
                "flagList", flags
        ));
    }

    @PatchMapping("/feature-flags/{key}")
    public ResponseEntity<?> toggleFeatureFlag(
            @PathVariable String key,
            @RequestBody Map<String, Boolean> payload,
            Principal principal
    ) {
        boolean enabled = payload.getOrDefault("enabled", false);
        PlatformFeatureFlag flag = platformConfigService.setFlagStatus(key, enabled, principal != null ? principal.getName() : "ADMIN");
        contentVersionService.bumpVersion();
        return ResponseEntity.ok(flag);
    }

    @PutMapping("/feature-flags")
    public ResponseEntity<?> updateAllFeatureFlags(
            @RequestBody Map<String, Object> payload,
            Principal principal
    ) {
        String actor = principal != null ? principal.getName() : "ADMIN";
        Object flagsObj = payload.get("flags");
        if (flagsObj instanceof Map<?, ?> map) {
            map.forEach((k, v) -> {
                String flagKey = String.valueOf(k);
                boolean enabled = false;
                if (v instanceof Map<?, ?> detail) {
                    Object en = detail.get("enabled");
                    if (en instanceof Boolean b) enabled = b;
                    else if (en != null) enabled = Boolean.parseBoolean(en.toString());
                } else if (v instanceof Boolean b) {
                    enabled = b;
                }
                platformConfigService.setFlagStatus(flagKey, enabled, actor);
            });
        }
        contentVersionService.bumpVersion();
        return ResponseEntity.ok(Map.of("success", true, "message", "Feature flags synchronized"));
    }

    // =========================================================================
    // 8. AUDIT LOGS (/api/admin/audit-logs)
    // =========================================================================
    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditLogService.getRecentLogs());
    }

    // =========================================================================
    // 9. SESSIONS & DEVICES (/api/admin/sessions)
    // =========================================================================
    @GetMapping("/sessions")
    public ResponseEntity<List<UserSession>> getActiveSessions() {
        return ResponseEntity.ok(userSessionService.getAllActiveSessions());
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<?> revokeSession(@PathVariable String id, Principal principal) {
        userSessionService.revokeSession(id, principal != null ? principal.getName() : "ADMIN");
        return ResponseEntity.ok(Map.of("success", true));
    }

    // =========================================================================
    // 10. FORCE-UPDATE & VERSION CONTROL (/api/admin/version-control)
    // =========================================================================
    @GetMapping("/version-control")
    public ResponseEntity<?> getVersionControl() {
        List<AppVersion> versions = platformConfigService.getAllVersions();
        Map<String, Object> map = new HashMap<>();
        for (AppVersion v : versions) {
            map.put(v.getClientType(), v);
        }
        return ResponseEntity.ok(map);
    }

    @PutMapping("/version-control")
    public ResponseEntity<?> bulkUpdateVersionControl(
            @RequestBody Map<String, Map<String, Object>> payload,
            Principal principal
    ) {
        String actor = principal != null ? principal.getName() : "ADMIN";
        payload.forEach((clientType, data) -> {
            AppVersion av = AppVersion.builder()
                    .clientType(clientType)
                    .clientName((String) data.get("name"))
                    .currentVersion((String) data.get("currentVersion"))
                    .minRequiredVersion((String) data.get("minRequiredVersion"))
                    .forceUpdateEnabled(Boolean.TRUE.equals(data.get("forceUpdateEnabled")))
                    .maintenanceMode(Boolean.TRUE.equals(data.get("maintenanceMode")))
                    .promptTitle((String) data.get("promptTitle"))
                    .promptMessage((String) data.get("promptMessage"))
                    .build();
            platformConfigService.updateVersionInfo(clientType, av, actor);
        });
        contentVersionService.bumpVersion();
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/version-control/{clientType}")
    public ResponseEntity<?> updateVersionControl(
            @PathVariable String clientType,
            @RequestBody AppVersion payload,
            Principal principal
    ) {
        AppVersion updated = platformConfigService.updateVersionInfo(clientType, payload, principal != null ? principal.getName() : "ADMIN");
        contentVersionService.bumpVersion();
        return ResponseEntity.ok(updated);
    }

    // =========================================================================
    // 11. CONTENT MODERATION (Reviews & Proofs)
    // =========================================================================
    @GetMapping("/moderation/reviews")
    public ResponseEntity<List<Map<String, Object>>> getModerationReviews() {
        return ResponseEntity.ok(adminService.getModerationReviews());
    }

    @PatchMapping("/moderation/reviews/{id}")
    public ResponseEntity<?> updateReviewStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> payload,
            Principal principal
    ) {
        String newStatus = payload.getOrDefault("status", "APPROVED");
        String actor = principal != null ? principal.getName() : "ADMIN";
        try {
            return adminService.updateReviewStatus(id, newStatus, actor)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/moderation/proofs")
    public ResponseEntity<List<Map<String, Object>>> getJobProofs() {
        return ResponseEntity.ok(adminService.getJobProofs());
    }

    @PatchMapping("/moderation/proofs/{id}")
    public ResponseEntity<?> updateProofStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> payload,
            Principal principal
    ) {
        String status = payload.getOrDefault("status", "APPROVED");
        String actor = principal != null ? principal.getName() : "ADMIN";
        return ResponseEntity.ok(adminService.updateProofStatus(id, status, actor));
    }

    // =========================================================================
    // 12. REAL LIVE ANALYTICS OVERVIEW
    // =========================================================================
    @GetMapping("/analytics/overview")
    public ResponseEntity<Map<String, Object>> getLiveAnalytics() {
        return ResponseEntity.ok(adminAnalyticsService.getOverviewStats());
    }

    // =========================================================================
    // 13. ROLES & PERMISSIONS (RBAC) (/api/admin/roles)
    // =========================================================================
    @GetMapping("/roles")
    public ResponseEntity<?> getRoles() {
        return ResponseEntity.ok(adminService.getRolesAndTeam());
    }

    @PutMapping("/roles")
    public ResponseEntity<?> updateRoles(@RequestBody Map<String, Object> payload, Principal principal) {
        String actor = principal != null ? principal.getName() : "ADMIN";
        adminService.updateRoles(payload.get("roles"), actor);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/roles/team")
    public ResponseEntity<?> addStaffMember(@RequestBody Map<String, String> req, Principal principal) {
        String name = req.get("name");
        String email = req.get("email");
        String roleId = req.getOrDefault("roleId", "OPERATIONS_MANAGER");
        String actor = principal != null ? principal.getName() : "ADMIN";

        try {
            Map<String, Object> resp = adminService.addStaffMember(name, email, roleId, actor);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/roles/team/{id}")
    public ResponseEntity<?> removeStaffMember(@PathVariable String id, Principal principal) {
        String actor = principal != null ? principal.getName() : "ADMIN";
        try {
            adminService.removeStaffMember(id, actor);
            return ResponseEntity.ok(Map.of("success", true, "message", "Staff privileges revoked successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
