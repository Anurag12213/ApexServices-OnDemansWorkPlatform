package com.apexservices.service;

import com.apexservices.model.*;
import com.apexservices.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final WorkRequestRepository workRequestRepository;
    private final WorkRequestEventRepository eventRepository;
    private final ReviewRepository reviewRepository;
    private final PartnerDocumentRepository partnerDocumentRepository;
    private final SiteSettingRepository siteSettingRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final PartnerPresenceService partnerPresenceService;
    private final UserSessionService userSessionService;
    private final AuditLogService auditLogService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ContentVersionService contentVersionService;

    // =========================================================================
    // 1. USER MANAGEMENT
    // =========================================================================
    public List<Map<String, Object>> getAllUsers() {
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
            map.put("isDeleted", u.getDeletedAt() != null);
            map.put("deletedAt", u.getDeletedAt());
            result.add(map);
        }

        return result;
    }

    @Transactional
    public Map<String, Object> createUser(Map<String, Object> req, String actor) {
        String name = (String) req.get("name");
        String email = (String) req.get("email");
        String phone = (String) req.get("phone");
        String roleStr = (String) req.getOrDefault("role", "Customer");
        String password = (String) req.getOrDefault("password", "user123");

        if (email != null && userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("User with this email already exists");
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
                .password(passwordEncoder.encode(password))
                .build();

        userRepository.save(newUser);
        auditLogService.record(
                actor != null ? actor : "ADMIN",
                "ADMIN",
                "USER_CREATED",
                "USER",
                "USR-" + newUser.getId(),
                "Registered user " + email + " as " + role,
                "127.0.0.1"
        );
        return Map.of("success", true, "id", "USR-" + newUser.getId());
    }

    @Transactional
    public Optional<Map<String, Object>> toggleUserStatus(Long id, String actor) {
        return userRepository.findById(id).map(user -> {
            boolean nextState = !user.isActive();
            user.setActive(nextState);
            userRepository.save(user);

            if (!nextState) {
                partnerPresenceService.evictPartner(id);
                userSessionService.revokeAllUserSessions(id, actor != null ? actor : "ADMIN");
            }

            auditLogService.record(
                    actor != null ? actor : "ADMIN",
                    "ADMIN",
                    "USER_STATUS_TOGGLED",
                    "USER",
                    "USR-" + id,
                    "User " + user.getEmail() + " status set to " + (nextState ? "Active" : "Suspended"),
                    "127.0.0.1"
            );
            return Map.of("success", true, "active", user.isActive());
        });
    }

    @Transactional
    public Optional<Map<String, Object>> softDeleteUser(Long id, String actor) {
        return userRepository.findById(id).map(user -> {
            user.setDeletedAt(LocalDateTime.now());
            user.setActive(false);
            userRepository.save(user);

            partnerPresenceService.evictPartner(id);
            userSessionService.revokeAllUserSessions(id, actor != null ? actor : "ADMIN");

            auditLogService.record(
                    actor != null ? actor : "ADMIN",
                    "ADMIN",
                    "USER_SOFT_DELETED",
                    "USER",
                    "USR-" + id,
                    "Soft deleted user " + user.getEmail(),
                    "127.0.0.1"
            );
            return Map.of("success", true, "id", id);
        });
    }

    @Transactional
    public Optional<Map<String, Object>> restoreUser(Long id, String actor) {
        return userRepository.findById(id).map(user -> {
            user.setDeletedAt(null);
            user.setActive(true);
            userRepository.save(user);

            auditLogService.record(
                    actor != null ? actor : "ADMIN",
                    "ADMIN",
                    "USER_RESTORED",
                    "USER",
                    "USR-" + id,
                    "Restored user " + user.getEmail(),
                    "127.0.0.1"
            );
            return Map.of("success", true, "id", id);
        });
    }

    // =========================================================================
    // 2. BOOKING MANAGEMENT
    // =========================================================================
    public List<Map<String, Object>> getAllBookings() {
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

        return result;
    }

    @Transactional
    public Optional<Map<String, Object>> overrideBookingStatus(String id, String newStatusStr, String reason, String actor) {
        return workRequestRepository.findById(id).map(wr -> {
            try {
                WorkRequestStatus newStatus = WorkRequestStatus.valueOf(newStatusStr);
                wr.setStatus(newStatus);
            } catch (Exception ignored) {}

            workRequestRepository.save(wr);

            try {
                eventRepository.save(WorkRequestEvent.builder()
                        .workRequest(wr)
                        .fromStatus(wr.getStatus() != null ? wr.getStatus().name() : "UNKNOWN")
                        .toStatus(newStatusStr)
                        .actorRole("ADMIN")
                        .notes("Admin override: " + reason)
                        .build());
            } catch (Exception ignored) {}

            auditLogService.record(
                    actor != null ? actor : "ADMIN",
                    "ADMIN",
                    "ORDER_OVERRIDE",
                    "WORK_REQUEST",
                    id,
                    "Order " + id + " updated to " + newStatusStr + ". Reason: " + reason,
                    "127.0.0.1"
            );

            try {
                Map<String, Object> wsPayload = new HashMap<>();
                wsPayload.put("id", id);
                wsPayload.put("status", newStatusStr);
                wsPayload.put("updatedAt", LocalDateTime.now().toString());
                messagingTemplate.convertAndSend("/topic/work-requests/" + id, (Object) wsPayload, Collections.emptyMap());
            } catch (Exception e) {
                log.debug("WebSocket broadcast skipped: {}", e.getMessage());
            }

            return Map.of("success", true, "id", id, "status", newStatusStr);
        });
    }

    // =========================================================================
    // 3. VENDOR / PARTNER MANAGEMENT
    // =========================================================================
    public List<Map<String, Object>> getPartners() {
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

            List<PartnerDocument> docs = partnerDocumentRepository.findByPartnerIdOrderByUploadedAtDesc(p.getId());
            List<Map<String, Object>> docList = new ArrayList<>();
            for (PartnerDocument d : docs) {
                docList.add(Map.of(
                        "id", d.getId(),
                        "name", d.getDocumentName(),
                        "type", d.getDocumentType(),
                        "url", d.getDocumentUrl(),
                        "status", d.getStatus(),
                        "uploadedAt", d.getUploadedAt().format(DateTimeFormatter.ofPattern("MMM dd, yyyy"))
                ));
            }
            if (docList.isEmpty()) {
                docList.add(Map.of("id", "DOC-AADHAAR-" + p.getId(), "name", "Government Aadhaar / ID", "status", p.isActive() ? "VERIFIED" : "PENDING_REVIEW", "uploadedAt", "Recent"));
                docList.add(Map.of("id", "DOC-SKILL-" + p.getId(), "name", "Trade Skill Certification", "status", p.isActive() ? "VERIFIED" : "PENDING_REVIEW", "uploadedAt", "Recent"));
            }
            map.put("documents", docList);
            result.add(map);
        }

        return result;
    }

    @Transactional
    public Optional<Map<String, Object>> togglePartnerStatus(Long id, String actor) {
        return userRepository.findById(id).map(user -> {
            boolean nextState = !user.isActive();
            user.setActive(nextState);
            userRepository.save(user);

            if (!nextState) {
                partnerPresenceService.evictPartner(id);
                userSessionService.revokeAllUserSessions(id, actor != null ? actor : "ADMIN");
            }

            auditLogService.record(
                    actor != null ? actor : "ADMIN",
                    "ADMIN",
                    "PARTNER_STATUS_TOGGLED",
                    "PARTNER",
                    "PRT-" + id,
                    "Partner PRT-" + id + " is now " + (nextState ? "ACTIVE" : "SUSPENDED"),
                    "127.0.0.1"
            );
            return Map.of("success", true, "active", user.isActive());
        });
    }

    public List<Map<String, Object>> getPartnerDocuments(Long id) {
        List<PartnerDocument> docs = partnerDocumentRepository.findByPartnerIdOrderByUploadedAtDesc(id);
        List<Map<String, Object>> docList = new ArrayList<>();
        for (PartnerDocument d : docs) {
            Map<String, Object> docMap = new HashMap<>();
            docMap.put("id", d.getId());
            docMap.put("name", d.getDocumentName());
            docMap.put("type", d.getDocumentType() != null ? d.getDocumentType() : "AADHAAR");
            docMap.put("url", d.getDocumentUrl() != null ? d.getDocumentUrl() : "");
            docMap.put("status", d.getStatus() != null ? d.getStatus() : "PENDING_REVIEW");
            docMap.put("rejectionReason", d.getRejectionReason() != null ? d.getRejectionReason() : "");
            docMap.put("verifiedBy", d.getVerifiedBy() != null ? d.getVerifiedBy() : "");
            docMap.put("uploadedAt", d.getUploadedAt() != null ? d.getUploadedAt().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")) : "Recent");
            docList.add(docMap);
        }
        if (docList.isEmpty()) {
            docList.add(Map.of(
                    "id", "DOC-AADHAAR-" + id,
                    "name", "Government Aadhaar / ID",
                    "type", "AADHAAR",
                    "url", "https://storage.apexservices.com/docs/DOC-AADHAAR-" + id,
                    "status", "PENDING_REVIEW",
                    "rejectionReason", "",
                    "uploadedAt", "Recent"
            ));
            docList.add(Map.of(
                    "id", "DOC-SKILL-" + id,
                    "name", "Trade Skill Certification",
                    "type", "CERTIFICATION",
                    "url", "https://storage.apexservices.com/docs/DOC-SKILL-" + id,
                    "status", "PENDING_REVIEW",
                    "rejectionReason", "",
                    "uploadedAt", "Recent"
            ));
        }
        return docList;
    }

    // =========================================================================
    // 4. CONTENT MODERATION
    // =========================================================================
    public List<Map<String, Object>> getModerationReviews() {
        List<Review> list = reviewRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Review r : list) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", "REV-" + r.getId());
            map.put("rawId", r.getId());
            map.put("customerName", r.getCustomer() != null ? r.getCustomer().getFullName() : "Customer");
            map.put("serviceName", r.getWorkRequest() != null ? r.getWorkRequest().getServiceCategory() : "Home Service");
            map.put("orderId", r.getWorkRequest() != null ? r.getWorkRequest().getId() : "ORD-" + r.getId());
            map.put("rating", r.getRating());
            map.put("status", r.getStatus() != null ? r.getStatus() : "PUBLISHED");
            map.put("comment", r.getReviewText() != null ? r.getReviewText() : "");
            map.put("flagReason", r.getRating() <= 2 ? "Low satisfaction rating flagged for QA review" : null);
            map.put("technicianName", r.getPartner() != null ? r.getPartner().getFullName() : "Certified Technician");
            map.put("timestamp", r.getCreatedAt() != null ? r.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")) : "Recent");
            result.add(map);
        }
        return result;
    }

    @Transactional
    public Optional<Map<String, Object>> updateReviewStatus(String id, String newStatus, String actor) {
        String cleanId = id.replace("REV-", "").trim();
        Long numId;
        try {
            numId = Long.parseLong(cleanId);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid review ID");
        }

        return reviewRepository.findById(numId).map(r -> {
            r.setStatus(newStatus);
            reviewRepository.save(r);

            auditLogService.record(
                    actor != null ? actor : "ADMIN",
                    "ADMIN",
                    "REVIEW_MODERATED",
                    "REVIEW",
                    id,
                    "Review status set to " + newStatus,
                    "127.0.0.1"
            );
            return Map.of("success", true, "status", newStatus);
        });
    }

    public List<Map<String, Object>> getJobProofs() {
        List<WorkRequest> requests = workRequestRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 50)).getContent();
        List<Map<String, Object>> proofs = new ArrayList<>();
        for (WorkRequest wr : requests) {
            if (wr.getPhotoUrl() != null && !wr.getPhotoUrl().isBlank()) {
                proofs.add(Map.of(
                        "id", "PRF-" + wr.getId(),
                        "orderId", wr.getId(),
                        "serviceName", wr.getServiceCategory(),
                        "technicianName", wr.getAssignedPartnerName() != null ? wr.getAssignedPartnerName() : "Assigned Partner",
                        "status", (wr.getStatus() == WorkRequestStatus.COMPLETED || wr.getStatus() == WorkRequestStatus.CLOSED) ? "APPROVED" : "PENDING",
                        "beforePhoto", "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60",
                        "afterPhoto", wr.getPhotoUrl(),
                        "timestamp", wr.getCreatedAt() != null ? wr.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM dd, HH:mm")) : "Recent"
                ));
            }
        }
        return proofs;
    }

    public Map<String, Object> updateProofStatus(String id, String status, String actor) {
        auditLogService.record(
                actor != null ? actor : "ADMIN",
                "ADMIN",
                "PROOF_PHOTO_AUDITED",
                "JOB_PROOF",
                id,
                "Job completion proof marked as " + status,
                "127.0.0.1"
        );
        return Map.of("success", true, "id", id, "status", status);
    }

    // =========================================================================
    // 5. ROLES & RBAC
    // =========================================================================
    public Map<String, Object> getRolesAndTeam() {
        List<Map<String, Object>> roles = List.of();
        Optional<SiteSetting> setting = siteSettingRepository.findById("admin_roles_matrix");
        if (setting.isPresent()) {
            try {
                roles = objectMapper.readValue(setting.get().getValue(), new TypeReference<List<Map<String, Object>>>() {});
            } catch (Exception e) {
                log.warn("Failed to parse admin_roles_matrix: {}", e.getMessage());
            }
        }

        List<User> admins = userRepository.findByRole(Role.ROLE_ADMIN);
        List<Map<String, Object>> team = new ArrayList<>();
        for (User u : admins) {
            team.add(Map.of(
                    "id", "ADM-" + u.getId(),
                    "name", u.getFullName(),
                    "email", u.getEmail() != null ? u.getEmail() : "admin@apexservices.com",
                    "roleId", "SUPER_ADMIN",
                    "lastActive", "Active"
            ));
        }
        return Map.of("roles", roles, "team", team);
    }

    @Transactional
    public void updateRoles(Object rolesObj, String actor) {
        if (rolesObj != null) {
            try {
                String rolesJson = objectMapper.writeValueAsString(rolesObj);
                siteSettingRepository.save(new SiteSetting("admin_roles_matrix", rolesJson));
            } catch (Exception e) {
                log.error("Failed to serialize admin_roles_matrix", e);
            }
        }

        auditLogService.record(
                actor != null ? actor : "ADMIN",
                "ADMIN",
                "ROLES_PERMISSIONS_UPDATED",
                "SECURITY_RBAC",
                "ROLES_MATRIX",
                "Updated administrative role permission matrix",
                "127.0.0.1"
        );
        contentVersionService.bumpVersion();
    }

    @Transactional
    public Map<String, Object> addStaffMember(String name, String email, String roleId, String actor) {
        if (name == null || name.isBlank() || email == null || email.isBlank()) {
            throw new IllegalArgumentException("Name and email are required");
        }

        String normalizedEmail = email.trim().toLowerCase();
        User user;
        Optional<User> existing = userRepository.findByEmail(normalizedEmail);
        if (existing.isPresent()) {
            user = existing.get();
            user.setRole(Role.ROLE_ADMIN);
            user.setActive(true);
            userRepository.save(user);
        } else {
            user = User.builder()
                    .fullName(name)
                    .email(normalizedEmail)
                    .mobileNumber("91" + (System.currentTimeMillis() % 10000000000L))
                    .role(Role.ROLE_ADMIN)
                    .provider(AuthProvider.LOCAL)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .build();
            user = userRepository.save(user);
        }

        auditLogService.record(
                actor != null ? actor : "ADMIN",
                "ADMIN",
                "STAFF_MEMBER_INVITED",
                "STAFF",
                user.getId().toString(),
                "Invited staff member " + name + " (" + normalizedEmail + ") with role " + roleId,
                "127.0.0.1"
        );

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", "ADM-" + user.getId());
        resp.put("name", user.getFullName());
        resp.put("email", user.getEmail());
        resp.put("roleId", roleId);
        resp.put("lastActive", "Invitation Sent");

        return resp;
    }

    @Transactional
    public void removeStaffMember(String id, String actor) {
        String cleanId = id.replace("ADM-", "").replace("USR-", "").trim();
        Long numId;
        try {
            numId = Long.parseLong(cleanId);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid staff ID format");
        }

        User u = userRepository.findById(numId)
                .orElseThrow(() -> new NoSuchElementException("Staff member not found with ID: " + numId));

        if (numId == 1L || "anurag@apexservices.com".equalsIgnoreCase(u.getEmail())) {
            throw new IllegalArgumentException("Primary Super Administrator cannot be removed");
        }

        u.setActive(false);
        u.setRole(Role.ROLE_CUSTOMER);
        userRepository.save(u);

        auditLogService.record(
                actor != null ? actor : "ADMIN",
                "ADMIN",
                "STAFF_MEMBER_REMOVED",
                "STAFF",
                u.getId().toString(),
                "Removed administrative privileges for " + u.getFullName() + " (" + u.getEmail() + ")",
                "127.0.0.1"
        );
    }
}
