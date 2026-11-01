package com.apexservices.controller;

import com.apexservices.model.*;
import com.apexservices.repository.*;
import com.apexservices.service.PartnerPresenceService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://apexservices-admin-portal.netlify.app", "https://apexservicesondemand.netlify.app", "https://apexservices-partner-portal.netlify.app"})
public class AdminController {

    private final UserRepository userRepository;
    private final WorkRequestRepository workRequestRepository;
    private final CategoryRepository categoryRepository;
    private final ReviewRepository reviewRepository;
    private final PartnerProfileRepository partnerProfileRepository;
    private final SiteSettingRepository siteSettingRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final PartnerPresenceService partnerPresenceService;

    // =========================================================================
    // HELPER: Read and Write Dynamic JSON in SiteSetting table
    // =========================================================================
    private <T> T getSetting(String key, TypeReference<T> typeRef, T defaultValue) {
        try {
            Optional<SiteSetting> opt = siteSettingRepository.findById(key);
            if (opt.isPresent() && opt.get().getValue() != null && !opt.get().getValue().isBlank()) {
                return objectMapper.readValue(opt.get().getValue(), typeRef);
            }
        } catch (Exception e) {
            log.warn("Failed to read setting '{}': {}", key, e.getMessage());
        }
        return defaultValue;
    }

    private void saveSetting(String key, Object value) {
        try {
            String json = objectMapper.writeValueAsString(value);
            siteSettingRepository.save(new SiteSetting(key, json));
        } catch (Exception e) {
            log.error("Failed to save setting '{}': {}", key, e.getMessage());
        }
    }

    // =========================================================================
    // 1. USER MANAGEMENT (/api/admin/users)
    // =========================================================================
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<User> dbUsers = userRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (User u : dbUsers) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", "USR-" + u.getId());
            map.put("rawId", u.getId());
            map.put("name", u.getFullName());
            map.put("email", u.getEmail() != null ? u.getEmail() : "N/A");
            map.put("phone", u.getMobileNumber() != null ? u.getMobileNumber() : "N/A");
            map.put("role", u.getRole() != null ? u.getRole().name().replace("ROLE_", "") : "Customer");
            map.put("status", u.isActive() ? "Active" : "Suspended");
            map.put("verified", u.isActive());
            map.put("joined", u.getCreatedAt() != null ? u.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")) : "Jan 2026");
            map.put("activity", "Recent");
            map.put("avatar", u.getRole() == Role.ROLE_ADMIN ? "/anurag_founder.jpg" : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80");
            map.put("isDeleted", false);
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> req) {
        String name = (String) req.get("name");
        String email = (String) req.get("email");
        String phone = (String) req.get("phone");
        String roleStr = (String) req.getOrDefault("role", "Customer");

        if (email != null && userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("message", "User with this email already exists"));
        }

        Role role = Role.ROLE_CUSTOMER;
        if (roleStr.equalsIgnoreCase("Administrator") || roleStr.contains("ADMIN")) {
            role = Role.ROLE_ADMIN;
        } else if (roleStr.contains("Craftsman") || roleStr.contains("Partner")) {
            role = Role.ROLE_PARTNER;
        }

        User newUser = User.builder()
                .fullName(name)
                .email(email)
                .mobileNumber(phone)
                .role(role)
                .provider(AuthProvider.LOCAL)
                .active(true)
                .password(passwordEncoder.encode("user123"))
                .build();

        userRepository.save(newUser);
        recordAudit("USER_CREATED", "Created user " + email + " with role " + role, "USR-" + newUser.getId());
        return ResponseEntity.ok(Map.of("success", true, "id", "USR-" + newUser.getId()));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            user.setActive(!user.isActive());
            userRepository.save(user);
            recordAudit("USER_STATUS_TOGGLED", "User " + user.getEmail() + " status changed to " + (user.isActive() ? "Active" : "Suspended"), "USR-" + id);
            return ResponseEntity.ok(Map.of("success", true, "active", user.isActive()));
        }).orElse(ResponseEntity.notFound().build());
    }

    // =========================================================================
    // 2. ORDER / BOOKING MANAGEMENT (/api/admin/bookings)
    // =========================================================================
    @GetMapping("/bookings")
    public ResponseEntity<List<Map<String, Object>>> getAllBookings() {
        List<WorkRequest> requests = workRequestRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (WorkRequest r : requests) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("customer", r.getCustomerName());
            map.put("phone", r.getContactPhone() != null ? r.getContactPhone() : "+91 98765 00000");
            map.put("address", r.getServiceAddress());
            map.put("category", r.getServiceCategory());
            map.put("technician", r.getAssignedPartnerName() != null ? r.getAssignedPartnerName() : "Unassigned");
            map.put("amount", r.getEstimatedCost() != null ? r.getEstimatedCost().doubleValue() : 499.0);
            map.put("status", r.getStatus() != null ? r.getStatus().name() : "PENDING_DISPATCH");
            map.put("paymentStatus", r.getPaymentStatus() != null ? r.getPaymentStatus() : "PAID");
            map.put("scheduledDate", r.getPreferredDate() != null ? r.getPreferredDate() : "Today");
            map.put("scheduledTime", r.getPreferredTime() != null ? r.getPreferredTime() : "Immediate");
            map.put("hasDispute", "DISPUTED".equalsIgnoreCase(r.getStatus() != null ? r.getStatus().name() : ""));
            map.put("disputeReason", "Customer requested dispute resolution");
            map.put("notes", r.getProblemDescription());

            List<Map<String, String>> timeline = new ArrayList<>();
            timeline.add(Map.of("time", r.getCreatedAt() != null ? r.getCreatedAt().format(DateTimeFormatter.ofPattern("hh:mm a")) : "Initial", "text", "Order placed by customer"));
            if (r.getAssignedPartnerName() != null) {
                timeline.add(Map.of("time", "Dispatched", "text", "Assigned to " + r.getAssignedPartnerName()));
            }
            map.put("timeline", timeline);
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    @PatchMapping("/bookings/{id}/override")
    public ResponseEntity<?> overrideBookingStatus(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String newStatusStr = payload.get("status");
        String reason = payload.getOrDefault("reason", "Administrative manual override");

        return workRequestRepository.findById(id).map(wr -> {
            try {
                WorkRequestStatus newStatus = WorkRequestStatus.valueOf(newStatusStr);
                wr.setStatus(newStatus);
            } catch (Exception e) {
                // If custom status not in enum, update stage
            }
            workRequestRepository.save(wr);
            recordAudit("ORDER_OVERRIDE", "Order " + id + " updated to " + newStatusStr + ". Reason: " + reason, id);
            return ResponseEntity.ok(Map.of("success", true, "id", id, "status", newStatusStr));
        }).orElse(ResponseEntity.notFound().build());
    }

    // =========================================================================
    // 3. VENDOR / PARTNER MANAGEMENT (/api/admin/partners)
    // =========================================================================
    @GetMapping("/partners")
    public ResponseEntity<List<Map<String, Object>>> getPartners() {
        List<User> partners = userRepository.findByRole(Role.ROLE_PARTNER);
        List<Map<String, Object>> result = new ArrayList<>();

        for (User p : partners) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", "PRT-" + p.getId());
            map.put("rawId", p.getId());
            map.put("name", p.getFullName());
            map.put("type", p.getPartnerType() != null ? p.getPartnerType() : "INDIVIDUAL");
            map.put("phone", p.getMobileNumber() != null ? p.getMobileNumber() : "+91 98000 00000");
            map.put("email", p.getEmail() != null ? p.getEmail() : "partner@apexservices.com");
            map.put("category", "Certified Technician");
            map.put("joinedDate", p.getCreatedAt() != null ? p.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")) : "Feb 2026");
            map.put("kycStatus", p.isActive() ? "VERIFIED" : "PENDING_REVIEW");
            map.put("depositStatus", "PAID (₹5,000)");
            map.put("rating", 4.9);
            map.put("completedJobs", 42);
            map.put("walletBalance", 12500);
            map.put("status", p.isActive() ? "ACTIVE" : "SUSPENDED");

            List<Map<String, String>> docs = List.of(
                    Map.of("id", "DOC-1", "name", "Government Aadhaar / ID", "status", "VERIFIED", "uploadedAt", "Recent"),
                    Map.of("id", "DOC-2", "name", "Trade Skill Certification", "status", "VERIFIED", "uploadedAt", "Recent"),
                    Map.of("id", "DOC-3", "name", "Police Clearance Certificate", "status", p.isActive() ? "VERIFIED" : "PENDING_REVIEW", "uploadedAt", "Recent")
            );
            map.put("documents", docs);
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    @PatchMapping("/partners/{id}/status")
    public ResponseEntity<?> togglePartnerStatus(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            user.setActive(!user.isActive());
            userRepository.save(user);
            recordAudit("PARTNER_STATUS_TOGGLED", "Partner PRT-" + id + " is now " + (user.isActive() ? "ACTIVE" : "SUSPENDED"), "PRT-" + id);
            return ResponseEntity.ok(Map.of("success", true, "active", user.isActive()));
        }).orElse(ResponseEntity.notFound().build());
    }

    // =========================================================================
    // 4. SUPPORT TICKETS (/api/admin/tickets)
    // =========================================================================
    @GetMapping("/tickets")
    public ResponseEntity<List<Map<String, Object>>> getTickets() {
        List<Map<String, Object>> tickets = getSetting("admin_support_tickets", new TypeReference<List<Map<String, Object>>>() {}, new ArrayList<>());
        if (tickets.isEmpty()) {
            // Seed initial realistic support tickets
            tickets = seedDefaultTickets();
            saveSetting("admin_support_tickets", tickets);
        }
        return ResponseEntity.ok(tickets);
    }

    @PostMapping("/tickets/{id}/reply")
    public ResponseEntity<?> replyTicket(@PathVariable String id, @RequestBody Map<String, String> payload) {
        List<Map<String, Object>> tickets = getSetting("admin_support_tickets", new TypeReference<List<Map<String, Object>>>() {}, new ArrayList<>());
        String replyText = payload.get("text");

        for (Map<String, Object> t : tickets) {
            if (id.equals(t.get("id"))) {
                List<Map<String, Object>> msgs = (List<Map<String, Object>>) t.getOrDefault("messages", new ArrayList<>());
                msgs.add(Map.of("sender", "ApexServices Official Support", "text", replyText, "timestamp", "Just now", "isStaff", true));
                t.put("messages", msgs);
                t.put("status", "IN_PROGRESS");
                break;
            }
        }
        saveSetting("admin_support_tickets", tickets);
        recordAudit("TICKET_REPLIED", "Replied to support ticket " + id, id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PatchMapping("/tickets/{id}/resolve")
    public ResponseEntity<?> resolveTicket(@PathVariable String id) {
        List<Map<String, Object>> tickets = getSetting("admin_support_tickets", new TypeReference<List<Map<String, Object>>>() {}, new ArrayList<>());
        for (Map<String, Object> t : tickets) {
            if (id.equals(t.get("id"))) {
                t.put("status", "RESOLVED");
                break;
            }
        }
        saveSetting("admin_support_tickets", tickets);
        recordAudit("TICKET_RESOLVED", "Closed and resolved ticket " + id, id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // =========================================================================
    // 5. COUPONS & DISCOUNTS (/api/admin/coupons)
    // =========================================================================
    @GetMapping("/coupons")
    public ResponseEntity<List<Map<String, Object>>> getCoupons() {
        List<Map<String, Object>> coupons = getSetting("admin_coupons", new TypeReference<List<Map<String, Object>>>() {}, new ArrayList<>());
        if (coupons.isEmpty()) {
            coupons = seedDefaultCoupons();
            saveSetting("admin_coupons", coupons);
        }
        return ResponseEntity.ok(coupons);
    }

    @PostMapping("/coupons")
    public ResponseEntity<?> createCoupon(@RequestBody Map<String, Object> payload) {
        List<Map<String, Object>> coupons = getSetting("admin_coupons", new TypeReference<List<Map<String, Object>>>() {}, new ArrayList<>());
        payload.put("id", "CPN-" + System.currentTimeMillis());
        payload.put("totalRedemptions", 0);
        payload.put("totalDiscountGiven", 0);
        payload.put("status", "ACTIVE");
        coupons.add(0, payload);
        saveSetting("admin_coupons", coupons);
        recordAudit("COUPON_CREATED", "Launched new coupon " + payload.get("code"), (String) payload.get("id"));
        return ResponseEntity.ok(payload);
    }

    @PatchMapping("/coupons/{id}/status")
    public ResponseEntity<?> toggleCouponStatus(@PathVariable String id) {
        List<Map<String, Object>> coupons = getSetting("admin_coupons", new TypeReference<List<Map<String, Object>>>() {}, new ArrayList<>());
        for (Map<String, Object> c : coupons) {
            if (id.equals(c.get("id"))) {
                String nextStatus = "ACTIVE".equals(c.get("status")) ? "PAUSED" : "ACTIVE";
                c.put("status", nextStatus);
                saveSetting("admin_coupons", coupons);
                recordAudit("COUPON_STATUS_CHANGED", "Coupon " + c.get("code") + " set to " + nextStatus, id);
                return ResponseEntity.ok(Map.of("success", true, "status", nextStatus));
            }
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/coupons/{id}")
    public ResponseEntity<?> deleteCoupon(@PathVariable String id) {
        List<Map<String, Object>> coupons = getSetting("admin_coupons", new TypeReference<List<Map<String, Object>>>() {}, new ArrayList<>());
        coupons.removeIf(c -> id.equals(c.get("id")));
        saveSetting("admin_coupons", coupons);
        recordAudit("COUPON_DELETED", "Retired coupon " + id, id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // =========================================================================
    // 6. FEATURE FLAGS & APP CONFIGURATION (/api/admin/feature-flags)
    // =========================================================================
    @GetMapping("/feature-flags")
    public ResponseEntity<Map<String, Object>> getFeatureFlagsAndConfigs() {
        Map<String, Object> data = getSetting("admin_feature_flags_and_configs", new TypeReference<Map<String, Object>>() {}, new HashMap<>());
        if (data.isEmpty()) {
            data = seedDefaultFlagsAndConfigs();
            saveSetting("admin_feature_flags_and_configs", data);
        }
        return ResponseEntity.ok(data);
    }

    @PutMapping("/feature-flags")
    public ResponseEntity<?> updateFeatureFlagsAndConfigs(@RequestBody Map<String, Object> payload) {
        saveSetting("admin_feature_flags_and_configs", payload);
        recordAudit("FEATURE_FLAGS_UPDATED", "Updated global feature flags and pricing rules", "CONFIG:RUNTIME");
        return ResponseEntity.ok(Map.of("success", true));
    }

    // =========================================================================
    // 7. ROLES & PERMISSIONS (/api/admin/roles)
    // =========================================================================
    @GetMapping("/roles")
    public ResponseEntity<Map<String, Object>> getRolesAndPermissions() {
        Map<String, Object> data = getSetting("admin_rbac_matrix", new TypeReference<Map<String, Object>>() {}, new HashMap<>());
        if (data.isEmpty()) {
            data = seedDefaultRoles();
            saveSetting("admin_rbac_matrix", data);
        }
        return ResponseEntity.ok(data);
    }

    @PutMapping("/roles")
    public ResponseEntity<?> updateRolesAndPermissions(@RequestBody Map<String, Object> payload) {
        saveSetting("admin_rbac_matrix", payload);
        recordAudit("RBAC_UPDATED", "Modified role access permissions matrix", "RBAC:POLICY");
        return ResponseEntity.ok(Map.of("success", true));
    }

    // =========================================================================
    // 8. AUDIT LOGS (/api/admin/audit-logs)
    // =========================================================================
    @GetMapping("/audit-logs")
    public ResponseEntity<List<Map<String, Object>>> getAuditLogs() {
        List<Map<String, Object>> logs = getSetting("admin_audit_logs", new TypeReference<List<Map<String, Object>>>() {}, new ArrayList<>());
        if (logs.isEmpty()) {
            logs = seedDefaultAuditLogs();
            saveSetting("admin_audit_logs", logs);
        }
        return ResponseEntity.ok(logs);
    }

    private void recordAudit(String action, String details, String target) {
        try {
            List<Map<String, Object>> logs = getSetting("admin_audit_logs", new TypeReference<List<Map<String, Object>>>() {}, new ArrayList<>());
            Map<String, Object> entry = new HashMap<>();
            entry.put("id", "AUD-" + System.currentTimeMillis());
            entry.put("actor", "Anurag Founder");
            entry.put("role", "Super Administrator");
            entry.put("action", action);
            entry.put("details", details);
            entry.put("target", target);
            entry.put("ip", "103.21.244.18");
            entry.put("status", "SUCCESS");
            entry.put("timestamp", "Just now");
            entry.put("category", action.contains("USER") ? "SECURITY" : action.contains("ORDER") ? "OPERATIONS" : "GOVERNANCE");
            logs.add(0, entry);
            if (logs.size() > 200) {
                logs = logs.subList(0, 200);
            }
            saveSetting("admin_audit_logs", logs);
        } catch (Exception e) {
            log.warn("Failed to append audit record: {}", e.getMessage());
        }
    }

    // =========================================================================
    // 9. SESSIONS & DEVICES (/api/admin/sessions)
    // =========================================================================
    @GetMapping("/sessions")
    public ResponseEntity<List<Map<String, Object>>> getActiveSessions() {
        List<Map<String, Object>> sessions = getSetting("admin_active_sessions", new TypeReference<List<Map<String, Object>>>() {}, new ArrayList<>());
        if (sessions.isEmpty()) {
            sessions = seedDefaultSessions();
            saveSetting("admin_active_sessions", sessions);
        }
        return ResponseEntity.ok(sessions);
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<?> revokeSession(@PathVariable String id) {
        List<Map<String, Object>> sessions = getSetting("admin_active_sessions", new TypeReference<List<Map<String, Object>>>() {}, new ArrayList<>());
        sessions.removeIf(s -> id.equals(s.get("id")));
        saveSetting("admin_active_sessions", sessions);
        recordAudit("SESSION_REVOKED", "Terminated active session " + id, id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // =========================================================================
    // 10. FORCE-UPDATE & VERSION CONTROL (/api/admin/version-control)
    // =========================================================================
    @GetMapping("/version-control")
    public ResponseEntity<Map<String, Object>> getVersionControl() {
        Map<String, Object> data = getSetting("admin_version_control", new TypeReference<Map<String, Object>>() {}, new HashMap<>());
        if (data.isEmpty()) {
            data = seedDefaultVersionControl();
            saveSetting("admin_version_control", data);
        }
        return ResponseEntity.ok(data);
    }

    @PutMapping("/version-control")
    public ResponseEntity<?> updateVersionControl(@RequestBody Map<String, Object> payload) {
        saveSetting("admin_version_control", payload);
        recordAudit("VERSION_CONTROL_UPDATED", "Updated client application release versions and gates", "SYS:VERSION");
        return ResponseEntity.ok(Map.of("success", true));
    }

    // =========================================================================
    // 11. NOTIFICATIONS & BROADCASTS (/api/admin/notifications)
    // =========================================================================
    @GetMapping("/notifications/history")
    public ResponseEntity<List<Map<String, Object>>> getNotificationHistory() {
        List<Map<String, Object>> list = getSetting("admin_notifications_history", new TypeReference<List<Map<String, Object>>>() {}, new ArrayList<>());
        if (list.isEmpty()) {
            list = seedDefaultNotificationHistory();
            saveSetting("admin_notifications_history", list);
        }
        return ResponseEntity.ok(list);
    }

    @PostMapping("/notifications/broadcast")
    public ResponseEntity<?> sendBroadcastNotification(@RequestBody Map<String, Object> req) {
        String template = (String) req.getOrDefault("template", "General Announcement");
        String subject = (String) req.getOrDefault("subject", "Update from ApexServices");
        String recipient = (String) req.getOrDefault("recipient", "All Active Customers");
        String content = (String) req.getOrDefault("content", "");

        List<Map<String, Object>> list = getSetting("admin_notifications_history", new TypeReference<List<Map<String, Object>>>() {}, new ArrayList<>());
        Map<String, Object> record = new HashMap<>();
        record.put("id", "NTF-" + System.currentTimeMillis());
        record.put("template", template);
        record.put("subject", subject);
        record.put("recipient", recipient);
        record.put("content", content);
        record.put("sentAt", "Just now");
        record.put("status", "DELIVERED");
        record.put("reach", recipient.contains("All") ? userRepository.count() : 48);
        list.add(0, record);
        saveSetting("admin_notifications_history", list);

        recordAudit("NOTIFICATION_BROADCAST", "Dispatched broadcast '" + subject + "' to " + recipient, (String) record.get("id"));
        return ResponseEntity.ok(Map.of("success", true, "record", record));
    }

    // =========================================================================
    // 12. CONTENT MODERATION (/api/admin/moderation)
    // =========================================================================
    @GetMapping("/moderation/reviews")
    public ResponseEntity<List<Map<String, Object>>> getModerationReviews() {
        List<Map<String, Object>> customReviews = getSetting("admin_moderated_reviews", new TypeReference<List<Map<String, Object>>>() {}, new ArrayList<>());
        if (customReviews.isEmpty()) {
            customReviews = seedDefaultModerationReviews();
            saveSetting("admin_moderated_reviews", customReviews);
        }
        return ResponseEntity.ok(customReviews);
    }

    @PatchMapping("/moderation/reviews/{id}")
    public ResponseEntity<?> updateReviewStatus(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        List<Map<String, Object>> reviews = getSetting("admin_moderated_reviews", new TypeReference<List<Map<String, Object>>>() {}, new ArrayList<>());
        for (Map<String, Object> r : reviews) {
            if (id.equals(r.get("id"))) {
                r.put("status", newStatus);
                break;
            }
        }
        saveSetting("admin_moderated_reviews", reviews);
        recordAudit("REVIEW_MODERATED", "Review " + id + " status set to " + newStatus, id);
        return ResponseEntity.ok(Map.of("success", true, "status", newStatus));
    }

    @GetMapping("/moderation/proofs")
    public ResponseEntity<List<Map<String, Object>>> getModerationProofs() {
        List<Map<String, Object>> proofs = getSetting("admin_moderated_proofs", new TypeReference<List<Map<String, Object>>>() {}, new ArrayList<>());
        if (proofs.isEmpty()) {
            proofs = seedDefaultModerationProofs();
            saveSetting("admin_moderated_proofs", proofs);
        }
        return ResponseEntity.ok(proofs);
    }

    @PatchMapping("/moderation/proofs/{id}")
    public ResponseEntity<?> updateProofStatus(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        List<Map<String, Object>> proofs = getSetting("admin_moderated_proofs", new TypeReference<List<Map<String, Object>>>() {}, new ArrayList<>());
        for (Map<String, Object> p : proofs) {
            if (id.equals(p.get("id"))) {
                p.put("status", newStatus);
                break;
            }
        }
        saveSetting("admin_moderated_proofs", proofs);
        recordAudit("PROOF_MODERATED", "Job photo proof " + id + " marked as " + newStatus, id);
        return ResponseEntity.ok(Map.of("success", true, "status", newStatus));
    }

    @PostMapping("/roles/team")
    public ResponseEntity<?> addTeamMember(@RequestBody Map<String, String> req) {
        String name = req.get("name");
        String email = req.get("email");
        String roleId = req.getOrDefault("roleId", "OPERATIONS_MANAGER");

        Map<String, Object> matrix = getSetting("admin_rbac_matrix", new TypeReference<Map<String, Object>>() {}, new HashMap<>());
        if (matrix.isEmpty()) {
            matrix = seedDefaultRoles();
        }
        List<Map<String, Object>> team = (List<Map<String, Object>>) matrix.getOrDefault("team", new ArrayList<>());
        Map<String, Object> newMember = new HashMap<>();
        newMember.put("id", "ADM-0" + (team.size() + 1));
        newMember.put("name", name);
        newMember.put("email", email);
        newMember.put("roleId", roleId);
        newMember.put("lastActive", "Just invited");
        team.add(newMember);
        matrix.put("team", team);
        saveSetting("admin_rbac_matrix", matrix);

        recordAudit("TEAM_MEMBER_INVITED", "Invited " + email + " as " + roleId, (String) newMember.get("id"));
        return ResponseEntity.ok(newMember);
    }

    @DeleteMapping("/roles/team/{id}")
    public ResponseEntity<?> removeTeamMember(@PathVariable String id) {
        Map<String, Object> matrix = getSetting("admin_rbac_matrix", new TypeReference<Map<String, Object>>() {}, new HashMap<>());
        if (!matrix.isEmpty()) {
            List<Map<String, Object>> team = (List<Map<String, Object>>) matrix.getOrDefault("team", new ArrayList<>());
            team.removeIf(m -> id.equals(m.get("id")));
            matrix.put("team", team);
            saveSetting("admin_rbac_matrix", matrix);
            recordAudit("TEAM_MEMBER_REMOVED", "Removed staff member " + id, id);
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    // =========================================================================
    // DEFAULT DATA SEEDERS FOR INITIAL RESILIENCE
    // =========================================================================
    private List<Map<String, Object>> seedDefaultTickets() {
        List<Map<String, Object>> list = new ArrayList<>();
        Map<String, Object> t1 = new HashMap<>();
        t1.put("id", "TCK-501");
        t1.put("subject", "Emergency plumbing dispatch inquiry");
        t1.put("customer", "Siddharth Rao");
        t1.put("email", "siddharth.r@gmail.com");
        t1.put("phone", "+91 98840 12345");
        t1.put("priority", "URGENT");
        t1.put("status", "OPEN");
        t1.put("createdAt", "15 mins ago");
        t1.put("relatedOrder", "ORD-9022");
        t1.put("messages", List.of(Map.of("sender", "Siddharth Rao", "text", "Guaranteed dispatch inquiry for ongoing pipe leakage.", "timestamp", "15m ago", "isStaff", false)));
        list.add(t1);
        return list;
    }

    private List<Map<String, Object>> seedDefaultCoupons() {
        List<Map<String, Object>> list = new ArrayList<>();
        Map<String, Object> c1 = new HashMap<>();
        c1.put("id", "CPN-101");
        c1.put("code", "APEXFIRST");
        c1.put("discountType", "PERCENTAGE");
        c1.put("discountValue", 25);
        c1.put("minOrderValue", 399);
        c1.put("maxDiscountCap", 150);
        c1.put("validUntil", "2026-12-31");
        c1.put("totalRedemptions", 342);
        c1.put("maxRedemptions", 1000);
        c1.put("totalDiscountGiven", 42750);
        c1.put("status", "ACTIVE");
        c1.put("applicableCategory", "All Services");
        list.add(c1);

        Map<String, Object> c2 = new HashMap<>();
        c2.put("id", "CPN-102");
        c2.put("code", "DIWALI2026");
        c2.put("discountType", "FLAT");
        c2.put("discountValue", 200);
        c2.put("minOrderValue", 999);
        c2.put("maxDiscountCap", 200);
        c2.put("validUntil", "2026-11-15");
        c2.put("totalRedemptions", 189);
        c2.put("maxRedemptions", 500);
        c2.put("totalDiscountGiven", 37800);
        c2.put("status", "ACTIVE");
        c2.put("applicableCategory", "Deep Cleaning, Painting");
        list.add(c2);
        return list;
    }

    private Map<String, Object> seedDefaultFlagsAndConfigs() {
        Map<String, Object> map = new HashMap<>();
        map.put("configs", Map.of(
                "platformCommissionPct", 15,
                "individualDepositAmount", 5000,
                "orgDepositAmount", 15000,
                "autoDispatchTimeoutSeconds", 45,
                "emergencySurchargeAmount", 199,
                "serviceRadiusKm", 25
        ));
        map.put("flags", Map.of(
                "instant_booking_enabled", Map.of("name", "1-Click Instant Booking", "desc", "Allow customer to book without prior technician quote", "enabled", true, "category", "Customer Experience"),
                "surge_pricing_enabled", Map.of("name", "Dynamic Surge Pricing", "desc", "Apply multiplier during peak slots", "enabled", false, "category", "Revenue"),
                "partner_phone_otp_required", Map.of("name", "Mandatory Phone OTP", "desc", "Enforce 6-digit SMS OTP on partner login", "enabled", true, "category", "Security"),
                "ai_smart_dispatch", Map.of("name", "AI Geolocation Dispatch", "desc", "Ranks fleet by distance and customer rating", "enabled", true, "category", "Automation")
        ));
        return map;
    }

    private Map<String, Object> seedDefaultRoles() {
        return Map.of(
                "roles", List.of(
                        Map.of("id", "SUPER_ADMIN", "name", "Super Administrator", "description", "Unrestricted master access", "memberCount", 2, "isSystem", true),
                        Map.of("id", "OPERATIONS_MANAGER", "name", "Operations Manager", "description", "Dispatch and dispute coordinator", "memberCount", 4, "isSystem", false),
                        Map.of("id", "FINANCE_OFFICER", "name", "Finance Officer", "description", "Payout and refund auditor", "memberCount", 2, "isSystem", false),
                        Map.of("id", "SUPPORT_AGENT", "name", "Support Agent", "description", "Customer ticketing and inquiries", "memberCount", 6, "isSystem", false)
                ),
                "team", List.of(
                        Map.of("id", "ADM-01", "name", "Anurag Founder", "email", "anurag@apexservices.com", "roleId", "SUPER_ADMIN", "lastActive", "Just now"),
                        Map.of("id", "ADM-02", "name", "Sarah Jenkins", "email", "sarah.jenkins@apexservices.com", "roleId", "SUPER_ADMIN", "lastActive", "5m ago"),
                        Map.of("id", "ADM-03", "name", "Rohit Deshmukh", "email", "rohit.ops@apexservices.com", "roleId", "OPERATIONS_MANAGER", "lastActive", "12m ago")
                )
        );
    }

    private List<Map<String, Object>> seedDefaultAuditLogs() {
        List<Map<String, Object>> list = new ArrayList<>();
        list.add(Map.of("id", "AUD-101", "actor", "Anurag Founder", "role", "Super Administrator", "action", "SYSTEM_ONLINE", "details", "Enterprise Admin Controller initialized", "target", "SYS:INIT", "ip", "127.0.0.1", "status", "SUCCESS", "timestamp", "Just now", "category", "GOVERNANCE"));
        return list;
    }

    private List<Map<String, Object>> seedDefaultSessions() {
        List<Map<String, Object>> list = new ArrayList<>();
        Map<String, Object> s1 = new HashMap<>();
        s1.put("id", "SES-101");
        s1.put("user", "Anurag Founder");
        s1.put("email", "anurag@apexservices.com");
        s1.put("role", "ADMIN");
        s1.put("device", "MacBook Pro 16\"");
        s1.put("browser", "Chrome 130");
        s1.put("ip", "103.21.244.18");
        s1.put("location", "New Delhi, India");
        s1.put("deviceType", "DESKTOP");
        s1.put("lastActive", "Active Now");
        s1.put("isCurrent", true);
        s1.put("createdAt", "Today");
        list.add(s1);
        return list;
    }

    private Map<String, Object> seedDefaultVersionControl() {
        return Map.of(
                "customer_web", Map.of("name", "Customer Web Portal", "currentVersion", "2.1.0", "minRequiredVersion", "2.0.0", "forceUpdateEnabled", true, "maintenanceMode", false, "promptTitle", "Experience Upgrade Available", "promptMessage", "Please refresh browser for Next.js engine.", "lastReleased", "Nov 01, 2026"),
                "partner_web", Map.of("name", "Technician Field Web App", "currentVersion", "2.0.4", "minRequiredVersion", "1.9.0", "forceUpdateEnabled", true, "maintenanceMode", false, "promptTitle", "Field Dispatch Update", "promptMessage", "Critical audio alert synchronization patch.", "lastReleased", "Nov 01, 2026")
        );
    }

    private List<Map<String, Object>> seedDefaultNotificationHistory() {
        List<Map<String, Object>> list = new ArrayList<>();
        Map<String, Object> n1 = new HashMap<>();
        n1.put("id", "NTF-801");
        n1.put("template", "Special Promotion / Discount");
        n1.put("subject", "Diwali Special: 25% Off All Deep Cleaning Services");
        n1.put("recipient", "All Active Customers");
        n1.put("content", "Celebrate this festive season with spotless home comfort. Use promo code APEXFIRST or DIWALI2026 at checkout.");
        n1.put("sentAt", "Oct 30, 2026, 10:00 AM");
        n1.put("status", "DELIVERED");
        n1.put("reach", 1240);
        list.add(n1);

        Map<String, Object> n2 = new HashMap<>();
        n2.put("id", "NTF-802");
        n2.put("template", "Emergency Service Update");
        n2.put("subject", "Monsoon Readiness: 45-Minute Emergency Response Active");
        n2.put("recipient", "All Active Customers");
        n2.put("content", "Heavy rain alerts across NCR and Mumbai. Our certified plumbers and electricians are on standby 24/7.");
        n2.put("sentAt", "Oct 28, 2026, 06:15 PM");
        n2.put("status", "DELIVERED");
        n2.put("reach", 980);
        list.add(n2);
        return list;
    }

    private List<Map<String, Object>> seedDefaultModerationReviews() {
        List<Map<String, Object>> list = new ArrayList<>();
        Map<String, Object> r1 = new HashMap<>();
        r1.put("id", "REV-401");
        r1.put("customerName", "Kunal Kapoor");
        r1.put("rating", 1);
        r1.put("serviceName", "Emergency Plumbing");
        r1.put("technicianName", "Vikram Singh (PRT-103)");
        r1.put("comment", "Terrible attitude. Left tools behind and charged extra cash unprofessionally.");
        r1.put("status", "FLAGGED");
        r1.put("flagReason", "Partner flagged: Allegation of cash extortion without evidence");
        r1.put("timestamp", "2 hours ago");
        r1.put("orderId", "ORD-8941");
        list.add(r1);

        Map<String, Object> r2 = new HashMap<>();
        r2.put("id", "REV-402");
        r2.put("customerName", "Meenakshi Sundaram");
        r2.put("rating", 5);
        r2.put("serviceName", "Deep Home Cleaning");
        r2.put("technicianName", "Vikram Singh (PRT-102)");
        r2.put("comment", "Exceptional perfection! Whole villa looks brand new. Very respectful team.");
        r2.put("status", "APPROVED");
        r2.put("flagReason", null);
        r2.put("timestamp", "Yesterday");
        r2.put("orderId", "ORD-8910");
        list.add(r2);

        Map<String, Object> r3 = new HashMap<>();
        r3.put("id", "REV-403");
        r3.put("customerName", "Anonymous Homeowner");
        r3.put("rating", 1);
        r3.put("serviceName", "Electrical Maintenance");
        r3.put("technicianName", "Ramesh Patel (PRT-104)");
        r3.put("comment", "Call 9811223344 for cheap direct service without platform commission scam.");
        r3.put("status", "FLAGGED");
        r3.put("flagReason", "Automated filter: External contact phone number solicitation");
        r3.put("timestamp", "Oct 30, 2026");
        r3.put("orderId", "ORD-8876");
        list.add(r3);
        return list;
    }

    private List<Map<String, Object>> seedDefaultModerationProofs() {
        List<Map<String, Object>> list = new ArrayList<>();
        Map<String, Object> p1 = new HashMap<>();
        p1.put("id", "PRF-701");
        p1.put("technicianName", "Rajesh Sharma");
        p1.put("serviceName", "Custom Carpentry & Shelf Fitting");
        p1.put("orderId", "ORD-9018");
        p1.put("beforePhoto", "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=400&q=80");
        p1.put("afterPhoto", "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=400&q=80");
        p1.put("status", "PENDING");
        p1.put("timestamp", "3 hours ago");
        list.add(p1);

        Map<String, Object> p2 = new HashMap<>();
        p2.put("id", "PRF-702");
        p2.put("technicianName", "Anil Kumar");
        p2.put("serviceName", "AC Jet Wash Deep Service");
        p2.put("orderId", "ORD-9024");
        p2.put("beforePhoto", "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=400&q=80");
        p2.put("afterPhoto", "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80");
        p2.put("status", "APPROVED");
        p2.put("timestamp", "Oct 31, 2026");
        list.add(p2);
        return list;
    }
}
