package com.apexservices.service;

import com.apexservices.dto.WorkRequestClaimResponseDto;
import com.apexservices.dto.WorkRequestDto;
import com.apexservices.dto.WorkRequestResponseDto;
import com.apexservices.exception.ConflictException;
import com.apexservices.model.*;
import com.apexservices.repository.CategoryRepository;
import com.apexservices.repository.UserRepository;
import com.apexservices.repository.WorkRequestBroadcastRepository;
import com.apexservices.repository.WorkRequestRejectionRepository;
import com.apexservices.repository.WorkRequestRepository;
import com.apexservices.security.InputSanitizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class WorkRequestService {

    private static final Logger log = LoggerFactory.getLogger(WorkRequestService.class);

    private final WorkRequestRepository workRequestRepository;
    private final WorkRequestRejectionRepository rejectionRepository;
    private final WorkRequestBroadcastRepository broadcastRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final DispatchNotificationService notificationService;
    private final PartnerPresenceService presenceService;
    private final OtpSecurityService otpSecurityService;
    private final ReviewService reviewService;
    private final PartnerProfileService partnerProfileService;
    private final PaymentAndLedgerService paymentAndLedgerService;
    private final com.apexservices.repository.WorkRequestEventRepository eventRepository;

    public WorkRequestService(
            WorkRequestRepository workRequestRepository,
            WorkRequestRejectionRepository rejectionRepository,
            WorkRequestBroadcastRepository broadcastRepository,
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            DispatchNotificationService notificationService,
            PartnerPresenceService presenceService,
            OtpSecurityService otpSecurityService,
            ReviewService reviewService,
            PartnerProfileService partnerProfileService,
            PaymentAndLedgerService paymentAndLedgerService,
            com.apexservices.repository.WorkRequestEventRepository eventRepository) {
        this.workRequestRepository = workRequestRepository;
        this.rejectionRepository = rejectionRepository;
        this.broadcastRepository = broadcastRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.notificationService = notificationService;
        this.presenceService = presenceService;
        this.otpSecurityService = otpSecurityService;
        this.reviewService = reviewService;
        this.partnerProfileService = partnerProfileService;
        this.paymentAndLedgerService = paymentAndLedgerService;
        this.eventRepository = eventRepository;
    }

    /**
     * Converts a WorkRequest entity to DTO with dynamic partner profile avatar resolution.
     * Ensures any partner avatar update is immediately and dynamically visible to customers.
     */
    public WorkRequestResponseDto toResponseDto(WorkRequest wr) {
        if (wr == null) return null;
        WorkRequestResponseDto dto = WorkRequestResponseDto.fromEntity(wr);
        if (wr.getAssignedPartner() != null) {
            String dynamicAvatar = partnerProfileService.getPartnerAvatarUrl(wr.getAssignedPartner().getId());
            if (dynamicAvatar != null && !dynamicAvatar.isBlank()) {
                dto.setAssignedPartnerPhoto(dynamicAvatar);
            }
        }
        return dto;
    }

    /**
     * Creates and broadcasts a new work request with a server-authoritative 45-second deadline.
     */
    @Transactional
    public WorkRequestResponseDto createWorkRequest(WorkRequestDto dto, String authenticatedEmail) {
        String reqId = dto.getId() != null && !dto.getId().isBlank()
                ? InputSanitizer.sanitize(dto.getId())
                : "REQ-" + (System.currentTimeMillis() % 1000000);

        String email = authenticatedEmail != null && !authenticatedEmail.isBlank()
                ? authenticatedEmail.trim().toLowerCase()
                : (dto.getCustomerEmail() != null ? dto.getCustomerEmail().trim().toLowerCase() : null);

        User customer = null;
        if (email != null) {
            customer = userRepository.findByEmail(email).orElse(null);
        }

        BigDecimal cost = new BigDecimal("499.00");
        if (dto.getEstimatedCost() instanceof Number) {
            cost = BigDecimal.valueOf(((Number) dto.getEstimatedCost()).doubleValue());
        } else if (dto.getEstimatedCost() instanceof String) {
            try {
                cost = new BigDecimal((String) dto.getEstimatedCost());
            } catch (Exception ignored) {}
        }

        // Resolve and validate category from database
        Category category = null;
        if (dto.getServiceCategoryId() != null) {
            category = categoryRepository.findById(dto.getServiceCategoryId()).orElse(null);
        }
        if (category == null && dto.getServiceCategory() != null && !dto.getServiceCategory().isBlank()) {
            String catParam = dto.getServiceCategory().trim();
            category = categoryRepository.findByNameIgnoreCase(catParam)
                    .or(() -> categoryRepository.findBySlug(catParam.toLowerCase()))
                    .orElse(null);
        }

        if (category == null) {
            throw new IllegalArgumentException("Unknown or invalid service category: " + dto.getServiceCategory());
        }
        if (!category.isActive()) {
            throw new IllegalArgumentException("The category '" + category.getName() + "' is currently deactivated and not accepting new requests.");
        }

        String canonicalCategoryName = category.getName();
        Long categoryId = category.getId();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(120); // Server-authoritative 2-minute (120s) countdown

        WorkRequest wr = WorkRequest.builder()
                .id(reqId)
                .customer(customer)
                .customerName(InputSanitizer.sanitize(dto.getCustomerName()))
                .customerEmail(email)
                .contactPhone(dto.getContactPhone() != null ? dto.getContactPhone().trim() : null)
                .serviceCategory(canonicalCategoryName)
                .serviceCategoryId(categoryId)
                .serviceAddress(InputSanitizer.sanitize(dto.getServiceAddress()))
                .problemTitle(canonicalCategoryName + " Service")
                .problemDescription(InputSanitizer.sanitize(dto.getProblemDescription()))
                .urgency(dto.getUrgency() != null ? InputSanitizer.sanitize(dto.getUrgency()) : "Standard")
                .preferredDate(dto.getPreferredDate() != null ? InputSanitizer.sanitize(dto.getPreferredDate()) : null)
                .preferredTime(dto.getPreferredTime() != null ? InputSanitizer.sanitize(dto.getPreferredTime()) : null)
                .estimatedCost(cost)
                .status(WorkRequestStatus.BROADCASTED)
                .stage(1)
                .createdAt(now)
                .updatedAt(now)
                .expiresAt(expiresAt)
                .build();

        wr = workRequestRepository.save(wr);

        // Generate authoritative customer completion verification OTP
        otpSecurityService.generateAndStoreOtp(wr);

        // Record initial event
        eventRepository.save(WorkRequestEvent.builder()
                .workRequest(wr)
                .fromStatus(null)
                .toStatus(WorkRequestStatus.BROADCASTED.name())
                .actor(customer)
                .actorRole(customer != null ? "CUSTOMER" : "GUEST")
                .notes("Service request submitted and broadcasted to eligible partners")
                .build());

        // Record broadcasts ONLY for partners with verified eligibility for this category
        List<User> eligiblePartners = userRepository.findEligiblePartnersByCategoryId(categoryId);
        for (User p : eligiblePartners) {
            if (p.isActive()) {
                try {
                    WorkRequestBroadcast broadcast = WorkRequestBroadcast.builder()
                            .workRequest(wr)
                            .partner(p)
                            .notifiedAt(now)
                            .build();
                    broadcastRepository.save(broadcast);
                } catch (Exception ex) {
                    log.warn("Failed recording broadcast for partner {}: {}", p.getId(), ex.getMessage());
                }
            }
        }

        WorkRequestResponseDto responseDto = toResponseDto(wr);
        // Real-time broadcast to all eligible listening partners
        notificationService.broadcastNewRequest(responseDto);

        return responseDto;
    }

    /**
     * Retrieves active incoming broadcasts matching the partner's assigned categories, excluding rejected ones.
     */
    @Transactional(readOnly = true)
    public List<WorkRequestResponseDto> getPartnerFeed(String partnerEmail, String category) {
        User partner = userRepository.findByEmail(partnerEmail.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Partner account not found"));

        if (!partner.isActive()) {
            throw new IllegalArgumentException("Partner account is deactivated");
        }

        List<Long> assignedCategoryIds = userRepository.findCategoryIdsByPartnerId(partner.getId());
        List<String> assignedCategoryNames = userRepository.findCategoryNamesByPartnerId(partner.getId());

        if (assignedCategoryIds.isEmpty()) {
            log.info("Partner {} has no assigned service categories in partner_service_categories", partnerEmail);
            return Collections.emptyList();
        }

        LocalDateTime now = LocalDateTime.now();
        List<WorkRequest> requests;

        if (category != null && !category.isBlank()) {
            String filter = category.trim();
            boolean isEligibleForFilter = assignedCategoryNames.stream().anyMatch(n -> n.equalsIgnoreCase(filter))
                    || assignedCategoryIds.stream().anyMatch(id -> String.valueOf(id).equals(filter));
            if (!isEligibleForFilter) {
                // Partner not eligible for requested filter
                return Collections.emptyList();
            }
            requests = workRequestRepository.findEligibleBroadcastsForPartner(partner.getId(), filter, now);
        } else {
            // Strictly query requests matching partner's assigned categories
            requests = workRequestRepository.findEligibleBroadcastsForPartnerCategories(partner.getId(), assignedCategoryIds, assignedCategoryNames, now);
        }

        List<WorkRequestResponseDto> result = new ArrayList<>();
        for (WorkRequest wr : requests) {
            result.add(toResponseDto(wr));
        }
        return result;
    }

    /**
     * Atomically claims a work request.
     * Guaranteed only one winner: Competing partners receive HTTP 409 Conflict.
     */
    @Transactional
    public WorkRequestClaimResponseDto claimWorkRequest(String requestId, String partnerEmail) {
        User partner = userRepository.findByEmail(partnerEmail.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Partner account not found"));

        if (partner.getRole() != Role.ROLE_PARTNER) {
            throw new IllegalArgumentException("Only verified partners can claim work requests");
        }
        if (!partner.isActive()) {
            throw new ConflictException("Partner account is inactive", "ACCOUNT_INACTIVE");
        }

        LocalDateTime claimedAt = LocalDateTime.now();
        PartnerProfile profile = partnerProfileService.getOrCreatePartnerProfile(partner.getId());
        String partnerName = partner.getFullName();
        String partnerPhone = partner.getMobileNumber() != null ? partner.getMobileNumber() : "Verified Technician";
        String partnerRating = reviewService.formatPartnerRating(partner.getId());
        String partnerPhoto = profile.getAvatarKey();

        int updatedRows = workRequestRepository.claimRequestAtomically(
                requestId,
                partner,
                partnerName,
                partnerPhone,
                partnerRating,
                partnerPhoto,
                claimedAt
        );

        if (updatedRows == 0) {
            // Check reason for failed atomic claim
            Optional<WorkRequest> existingOpt = workRequestRepository.findById(requestId);
            if (existingOpt.isEmpty()) {
                throw new IllegalArgumentException("Work request not found: " + requestId);
            }

            WorkRequest existing = existingOpt.get();
            if (existing.getExpiresAt() != null && existing.getExpiresAt().isBefore(claimedAt)) {
                throw new ConflictException("This work request has expired and can no longer be claimed.", "EXPIRED");
            }
            if (existing.getStatus() != WorkRequestStatus.BROADCASTED) {
                String claimedBy = existing.getAssignedPartnerName() != null ? existing.getAssignedPartnerName() : "another partner";
                throw new ConflictException("This work request was already claimed by " + claimedBy + ".", "ALREADY_CLAIMED");
            }

            throw new ConflictException("Could not claim work request: offer is no longer available.", "OFFER_UNAVAILABLE");
        }

        // Successfully claimed: reload updated record
        WorkRequest claimed = workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalStateException("Claimed request could not be reloaded: " + requestId));

        WorkRequestResponseDto responseDto = toResponseDto(claimed);

        // Record audit event
        eventRepository.save(WorkRequestEvent.builder()
                .workRequest(claimed)
                .fromStatus(WorkRequestStatus.BROADCASTED.name())
                .toStatus(WorkRequestStatus.ASSIGNED.name())
                .actor(partner)
                .actorRole("PARTNER")
                .notes("Work request claimed by partner: " + partnerName)
                .build());

        // Notify other partners to dismiss card and notify customer of partner assignment
        notificationService.notifyRequestClaimed(requestId, partner.getId(), partnerName, responseDto);

        return WorkRequestClaimResponseDto.success(responseDto);
    }

    /**
     * Records a partner rejection idempotently.
     */
    @Transactional
    public Map<String, Object> rejectWorkRequest(String requestId, String partnerEmail) {
        User partner = userRepository.findByEmail(partnerEmail.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Partner account not found"));

        WorkRequest wr = workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found: " + requestId));

        if (!rejectionRepository.existsByWorkRequestIdAndPartnerId(requestId, partner.getId())) {
            WorkRequestRejection rejection = WorkRequestRejection.builder()
                    .workRequest(wr)
                    .partner(partner)
                    .rejectedAt(LocalDateTime.now())
                    .build();
            rejectionRepository.save(rejection);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Request rejected successfully for this partner");
        response.put("requestId", requestId);
        return response;
    }

    /**
     * Gets a work request by ID with authoritative completion verification OTP.
     */
    @Transactional
    public WorkRequestResponseDto getWorkRequestById(String id) {
        WorkRequest wr = workRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found: " + id));
        WorkRequestResponseDto dto = toResponseDto(wr);
        String activeOtp = otpSecurityService.getActiveOtpForCustomer(id);
        if (activeOtp == null) {
            activeOtp = otpSecurityService.generateAndStoreOtp(wr);
        }
        dto.setCompletionOtp(activeOtp);
        return dto;
    }

    /**
     * Gets work requests, optionally filtered by customer email.
     */
    @Transactional(readOnly = true)
    public List<WorkRequestResponseDto> getWorkRequests(String email) {
        List<WorkRequest> list;
        if (email != null && !email.isBlank()) {
            list = workRequestRepository.findByCustomerEmailOrderByCreatedAtDesc(email.trim().toLowerCase());
        } else {
            list = workRequestRepository.findAll();
        }

        List<WorkRequestResponseDto> result = new ArrayList<>();
        for (WorkRequest wr : list) {
            result.add(toResponseDto(wr));
        }
        return result;
    }

    /**
     * Authoritatively advances work request service status.
     * Enforces strict state machine: ASSIGNED -> IN_TRANSIT -> ARRIVED -> IN_PROGRESS.
     * Service completion CANNOT be triggered here; it strictly requires verifyCompletion with customer OTP.
     */
    @Transactional
    public WorkRequestResponseDto advanceStage(String requestId, String userEmail) {
        WorkRequest wr = workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found: " + requestId));

        if (userEmail != null && wr.getAssignedPartner() != null && wr.getAssignedPartner().getEmail() != null) {
            if (!wr.getAssignedPartner().getEmail().equalsIgnoreCase(userEmail.trim())) {
                User caller = userRepository.findByEmail(userEmail.trim().toLowerCase()).orElse(null);
                if (caller == null || caller.getRole() != Role.ROLE_ADMIN) {
                    throw new AccessDeniedException("You are not assigned to this work request");
                }
            }
        }

        WorkRequestStatus current = wr.getStatus();
        WorkRequestStatus next;
        int nextStage;

        if (current == WorkRequestStatus.ASSIGNED) {
            next = WorkRequestStatus.IN_TRANSIT;
            nextStage = 3;
        } else if (current == WorkRequestStatus.IN_TRANSIT) {
            next = WorkRequestStatus.ARRIVED;
            nextStage = 4;
        } else if (current == WorkRequestStatus.ARRIVED) {
            next = WorkRequestStatus.IN_PROGRESS;
            nextStage = 4;
        } else if (current == WorkRequestStatus.IN_PROGRESS) {
            next = WorkRequestStatus.IN_PROGRESS;
            nextStage = 4;
        } else {
            next = current;
            nextStage = wr.getStage();
        }

        wr.setStatus(next);
        wr.setStage(nextStage);
        wr = workRequestRepository.save(wr);

        eventRepository.save(WorkRequestEvent.builder()
                .workRequest(wr)
                .fromStatus(current.name())
                .toStatus(next.name())
                .actor(wr.getAssignedPartner())
                .actorRole("PARTNER")
                .notes("Partner advanced status to " + next.name())
                .build());

        WorkRequestResponseDto dto = toResponseDto(wr);
        notificationService.notifyStageUpdated(requestId, dto);
        return dto;
    }

    /**
     * Verifies work completion using the customer's 4-digit verification code.
     * Atomically consumes the single-use OTP and transitions the job to COMPLETED / PAYMENT_PENDING.
     */
    @Transactional
    public WorkRequestResponseDto verifyCompletion(String requestId, String partnerEmail, String completionOtp) {
        WorkRequest wr = workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found: " + requestId));

        if (partnerEmail != null && wr.getAssignedPartner() != null && wr.getAssignedPartner().getEmail() != null) {
            if (!wr.getAssignedPartner().getEmail().equalsIgnoreCase(partnerEmail.trim())) {
                User caller = userRepository.findByEmail(partnerEmail.trim().toLowerCase()).orElse(null);
                if (caller == null || caller.getRole() != Role.ROLE_ADMIN) {
                    throw new AccessDeniedException("You are not assigned to this work request");
                }
            }
        }

        if (wr.getStatus() == WorkRequestStatus.COMPLETED) {
            return toResponseDto(wr);
        }
        if (wr.getStatus() == WorkRequestStatus.CANCELLED || wr.getStatus() == WorkRequestStatus.EXPIRED) {
            throw new ConflictException("Cannot verify completion for request in status: " + wr.getStatus(), "INVALID_STATUS");
        }

        // Verify and consume OTP
        otpSecurityService.verifyAndConsumeOtp(requestId, completionOtp);

        WorkRequestStatus prev = wr.getStatus();
        wr.setStatus(WorkRequestStatus.COMPLETED);
        wr.setStage(5);
        wr.setCompletedAt(LocalDateTime.now());
        if (wr.getPaymentStatus() == null || "UNPAID".equals(wr.getPaymentStatus())) {
            wr.setPaymentStatus("PAYMENT_PENDING");
        }
        wr = workRequestRepository.save(wr);

        eventRepository.save(WorkRequestEvent.builder()
                .workRequest(wr)
                .fromStatus(prev.name())
                .toStatus(WorkRequestStatus.COMPLETED.name())
                .actor(wr.getAssignedPartner())
                .actorRole("PARTNER")
                .notes("Work completion verified via customer completion OTP")
                .build());

        WorkRequestResponseDto dto = toResponseDto(wr);
        notificationService.notifyStageUpdated(requestId, dto);
        return dto;
    }

    /**
     * Retrieves the active completion OTP for the customer owner.
     */
    @Transactional
    public Map<String, String> getCustomerCompletionOtp(String requestId, String customerEmail) {
        WorkRequest wr = workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found: " + requestId));

        String activeOtp = otpSecurityService.getActiveOtpForCustomer(requestId);
        if (activeOtp == null) {
            activeOtp = otpSecurityService.generateAndStoreOtp(wr);
        }

        Map<String, String> result = new LinkedHashMap<>();
        result.put("requestId", requestId);
        result.put("completionOtp", activeOtp);
        result.put("otp", activeOtp);
        return result;
    }

    /**
     * Settles customer payment using the authoritative PaymentAndLedgerService.
     * Computes 20% platform fee and 80% partner earnings with idempotent accounting ledger entries.
     */
    @Transactional
    public WorkRequestResponseDto processPayment(String requestId, String paymentMethod, String userEmail) {
        WorkRequest wr = workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found: " + requestId));

        BigDecimal grossAmount = wr.getEstimatedCost() != null ? wr.getEstimatedCost() : new BigDecimal("499.00");
        paymentAndLedgerService.settleWorkRequestPayment(requestId, paymentMethod, grossAmount, userEmail);

        // Reload updated work request
        wr = workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalStateException("Reload failed for: " + requestId));

        WorkRequestResponseDto dto = toResponseDto(wr);
        notificationService.notifyStageUpdated(requestId, dto);
        return dto;
    }

    /**
     * Cancels a work request.
     */
    @Transactional
    public WorkRequestResponseDto cancelWorkRequest(String requestId, String userEmail) {
        WorkRequest wr = workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found: " + requestId));

        WorkRequestStatus prev = wr.getStatus();
        wr.setStatus(WorkRequestStatus.CANCELLED);
        wr = workRequestRepository.save(wr);

        eventRepository.save(WorkRequestEvent.builder()
                .workRequest(wr)
                .fromStatus(prev != null ? prev.name() : null)
                .toStatus(WorkRequestStatus.CANCELLED.name())
                .actor(wr.getCustomer())
                .actorRole("CUSTOMER")
                .notes("Work request cancelled by customer")
                .build());

        return toResponseDto(wr);
    }

    /**
     * Background scheduler that automatically expires un-claimed broadcasted requests.
     */
    @Scheduled(fixedRate = 5000)
    @Transactional
    public void expireOverdueRequests() {
        LocalDateTime now = LocalDateTime.now();
        List<WorkRequest> overdue = workRequestRepository.findByStatusOrderByCreatedAtDesc(WorkRequestStatus.BROADCASTED);
        for (WorkRequest wr : overdue) {
            if (wr.getExpiresAt() != null && wr.getExpiresAt().isBefore(now)) {
                wr.setStatus(WorkRequestStatus.EXPIRED);
                workRequestRepository.save(wr);
                log.info("Work request {} expired without a partner claim.", wr.getId());
                notificationService.notifyRequestExpired(wr.getId());
            }
        }
    }
}
