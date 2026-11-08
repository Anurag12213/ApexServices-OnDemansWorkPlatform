package com.apexservices.service;

import com.apexservices.dto.request.WorkRequestDto;
import com.apexservices.dto.response.WorkRequestClaimResponseDto;
import com.apexservices.dto.response.WorkRequestResponseDto;
import com.apexservices.exception.ConflictException;
import com.apexservices.model.*;
import com.apexservices.repository.CategoryRepository;
import com.apexservices.repository.UserRepository;
import com.apexservices.repository.WorkRequestBroadcastRepository;
import com.apexservices.repository.WorkRequestEventRepository;
import com.apexservices.repository.WorkRequestRejectionRepository;
import com.apexservices.repository.WorkRequestRepository;
import com.apexservices.security.InputSanitizer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class WorkRequestService {

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
    private final WorkRequestEventRepository eventRepository;
    private final com.apexservices.security.JwtService jwtService;

    @Autowired
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
            WorkRequestEventRepository eventRepository,
            @Autowired(required = false) com.apexservices.security.JwtService jwtService) {
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
        this.jwtService = jwtService;
    }

    // =========================================================================
    // DTO MAPPING HELPER
    // =========================================================================

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

    // =========================================================================
    // 1. CUSTOMER LIFECYCLE: SUBMIT WORK REQUEST (POST AND PICK)
    // =========================================================================

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
            if (customer == null) {
                String sanitizedName = dto.getCustomerName() != null && !dto.getCustomerName().isBlank()
                        ? InputSanitizer.sanitize(dto.getCustomerName())
                        : "Valued Customer";
                String phone = dto.getContactPhone() != null ? dto.getContactPhone().trim() : null;
                if (phone != null && userRepository.findByMobileNumber(phone).isPresent()) {
                    phone = null;
                }
                customer = User.builder()
                        .fullName(sanitizedName)
                        .email(email)
                        .mobileNumber(phone)
                        .password("$2a$10$" + UUID.randomUUID().toString().replace("-", "") + "UnUsAbLeGuEsT")
                        .role(Role.ROLE_CUSTOMER)
                        .provider(AuthProvider.LOCAL)
                        .active(true)
                        .build();
                try {
                    customer = userRepository.save(customer);
                } catch (Exception ex) {
                    log.warn("Customer auto-provision notice: {}", ex.getMessage());
                    customer = userRepository.findByEmail(email).orElse(null);
                }
            }
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
            throw new IllegalArgumentException("The category '" + category.getName() + "' is currently deactivated.");
        }

        String canonicalCategoryName = category.getName();
        Long categoryId = category.getId();

        LocalDateTime now = LocalDateTime.now();
        // Post and Pick: Published requests remain open for picking (24h availability window)
        LocalDateTime expiresAt = now.plusHours(24);

        WorkRequest wr = WorkRequest.builder()
                .id(reqId)
                .customer(customer)
                .customerName(InputSanitizer.sanitize(dto.getCustomerName()))
                .customerEmail(email)
                .contactPhone(dto.getContactPhone() != null ? dto.getContactPhone().trim() : null)
                .serviceCategory(canonicalCategoryName)
                .serviceCategoryId(categoryId)
                .serviceAddress(InputSanitizer.sanitize(dto.getServiceAddress()))
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .houseDetails(dto.getHouseDetails() != null ? InputSanitizer.sanitize(dto.getHouseDetails()) : null)
                .landmark(dto.getLandmark() != null ? InputSanitizer.sanitize(dto.getLandmark()) : null)
                .cityPostal(dto.getCityPostal() != null ? InputSanitizer.sanitize(dto.getCityPostal()) : null)
                .problemTitle(canonicalCategoryName + " Service")
                .problemDescription(InputSanitizer.sanitize(dto.getProblemDescription()))
                .urgency(dto.getUrgency() != null ? InputSanitizer.sanitize(dto.getUrgency()) : "Standard")
                .preferredDate(dto.getPreferredDate() != null ? InputSanitizer.sanitize(dto.getPreferredDate()) : null)
                .preferredTime(dto.getPreferredTime() != null ? InputSanitizer.sanitize(dto.getPreferredTime()) : null)
                .estimatedCost(cost)
                .status(WorkRequestStatus.POSTED)
                .stage(1)
                .createdAt(now)
                .updatedAt(now)
                .expiresAt(expiresAt)
                .build();

        wr = workRequestRepository.save(wr);

        // Generate authoritative customer completion verification OTP
        otpSecurityService.generateAndStoreOtp(wr);

        // Record audit event
        eventRepository.save(WorkRequestEvent.builder()
                .workRequest(wr)
                .fromStatus(null)
                .toStatus(WorkRequestStatus.POSTED.name())
                .actor(customer)
                .actorRole(customer != null ? "CUSTOMER" : "GUEST")
                .notes("Work request published to open marketplace (POST AND PICK)")
                .build());

        WorkRequestResponseDto responseDto = toResponseDto(wr);
        if (jwtService != null && customer != null) {
            try {
                String token = jwtService.generateToken(
                        new com.apexservices.security.CustomUserDetails(customer),
                        customer.getId(),
                        customer.getRole() != null ? customer.getRole().name() : "ROLE_CUSTOMER"
                );
                responseDto.setCustomerToken(token);
            } catch (Exception e) {
                log.warn("Could not generate customer token on work request creation: {}", e.getMessage());
            }
        }

        // Request successfully created and saved in database
        return responseDto;
    }

    // =========================================================================
    // 2. PARTNER MARKETPLACE: ALL JOBS & NEARBY JOBS (POST AND PICK)
    // =========================================================================

    /**
     * All published jobs eligible for the authenticated partner.
     * All eligible partners can browse all published jobs.
     */
    @Transactional(readOnly = true)
    public List<WorkRequestResponseDto> getPartnerAllJobs(String partnerEmail, String categoryFilter) {
        User partner = userRepository.findByEmail(partnerEmail.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Partner account not found"));

        if (!partner.isActive()) {
            throw new IllegalArgumentException("Partner account is deactivated");
        }

        List<Long> assignedCategoryIds = userRepository.findCategoryIdsByPartnerId(partner.getId());
        List<String> assignedCategoryNames = userRepository.findCategoryNamesByPartnerId(partner.getId());

        LocalDateTime now = LocalDateTime.now();
        List<WorkRequest> requests;

        if (assignedCategoryIds.isEmpty()) {
            // If partner has no restrictions, retrieve all published jobs
            requests = workRequestRepository.findAllAvailablePublishedJobs(now);
        } else {
            requests = workRequestRepository.findAvailablePublishedJobsForCategories(
                    assignedCategoryIds, assignedCategoryNames, true, now);
        }

        if (categoryFilter != null && !categoryFilter.isBlank()) {
            String cf = categoryFilter.trim();
            requests = requests.stream()
                    .filter(r -> cf.equalsIgnoreCase(r.getServiceCategory()) ||
                            (r.getServiceCategoryId() != null && String.valueOf(r.getServiceCategoryId()).equals(cf)))
                    .collect(Collectors.toList());
        }

        return requests.stream()
                .map(r -> WorkRequestResponseDto.forUnassignedPartner(r, null))
                .collect(Collectors.toList());
    }

    /**
     * Nearby Jobs filter based on partner coordinates and radius.
     * Nearby is a filtering feature, not a job visibility restriction.
     */
    @Transactional(readOnly = true)
    public List<WorkRequestResponseDto> getPartnerNearbyJobs(
            String partnerEmail,
            Double partnerLat,
            Double partnerLng,
            Double radiusKm,
            String categoryFilter) {

        List<WorkRequestResponseDto> allJobs = getPartnerAllJobs(partnerEmail, categoryFilter);

        if (partnerLat == null || partnerLng == null) {
            return allJobs;
        }

        double maxDist = (radiusKm != null && radiusKm > 0) ? radiusKm : 50.0;

        List<WorkRequestResponseDto> nearbyList = new ArrayList<>();
        for (WorkRequestResponseDto job : allJobs) {
            if (job.getLatitude() != null && job.getLongitude() != null) {
                double dist = calculateDistanceKm(
                        partnerLat, partnerLng,
                        job.getLatitude().doubleValue(), job.getLongitude().doubleValue());
                job.setDistanceKm(Math.round(dist * 10.0) / 10.0);
                if (dist <= maxDist) {
                    nearbyList.add(job);
                }
            } else {
                // Jobs without coordinates remain visible in All Jobs, but excluded from strict distance radius
                job.setDistanceKm(null);
            }
        }

        nearbyList.sort(Comparator.comparing(
                j -> j.getDistanceKm() != null ? j.getDistanceKm() : Double.MAX_VALUE));
        return nearbyList;
    }

    /**
     * Partner view of job details.
     * Full customer address & contact details are protected/masked before assignment.
     */
    @Transactional(readOnly = true)
    public WorkRequestResponseDto getPartnerJobDetail(String requestId, String partnerEmail) {
        User partner = userRepository.findByEmail(partnerEmail.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Partner account not found"));

        WorkRequest wr = workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found: " + requestId));

        boolean isAssigned = wr.getAssignedPartner() != null && wr.getAssignedPartner().getId().equals(partner.getId());

        if (isAssigned) {
            // Assigned partner sees full address, but OTP remains hidden
            WorkRequestResponseDto dto = toResponseDto(wr);
            dto.setCompletionOtp(null);
            return dto;
        }

        // Unassigned partner browsing: privacy-masked view
        return WorkRequestResponseDto.forUnassignedPartner(wr, null);
    }

    /**
     * Atomic Post and Pick Acceptance.
     * Guaranteed only one winner: Competing partners receive HTTP 409 Conflict.
     */
    @Transactional
    public WorkRequestClaimResponseDto acceptJobAtomically(String requestId, String partnerEmail) {
        User partner = userRepository.findByEmail(partnerEmail.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Partner account not found"));

        if (partner.getRole() != Role.ROLE_PARTNER) {
            throw new IllegalArgumentException("Only verified partners can accept work requests");
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
            Optional<WorkRequest> existingOpt = workRequestRepository.findById(requestId);
            if (existingOpt.isEmpty()) {
                throw new IllegalArgumentException("Work request not found: " + requestId);
            }

            WorkRequest existing = existingOpt.get();
            if (existing.getExpiresAt() != null && existing.getExpiresAt().isBefore(claimedAt)) {
                throw new ConflictException("This work request has expired and is no longer available.", "EXPIRED");
            }
            if (existing.getStatus() != WorkRequestStatus.POSTED && existing.getStatus() != WorkRequestStatus.BROADCASTED) {
                String claimedBy = existing.getAssignedPartnerName() != null ? existing.getAssignedPartnerName() : "another partner";
                throw new ConflictException("This work request was already accepted by " + claimedBy + ".", "ALREADY_CLAIMED");
            }

            throw new ConflictException("This job is no longer available.", "OFFER_UNAVAILABLE");
        }

        // Successfully claimed: reload updated record
        WorkRequest claimed = workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalStateException("Claimed request could not be reloaded: " + requestId));

        WorkRequestResponseDto responseDto = toResponseDto(claimed);
        responseDto.setCompletionOtp(null); // OTP is never shown to partner

        // Record audit event
        eventRepository.save(WorkRequestEvent.builder()
                .workRequest(claimed)
                .fromStatus(WorkRequestStatus.POSTED.name())
                .toStatus(WorkRequestStatus.ASSIGNED.name())
                .actor(partner)
                .actorRole("PARTNER")
                .notes("Work request accepted by partner: " + partnerName)
                .build());

        // Real-time broadcast: notify other partners to remove job from feed, and notify customer
        notificationService.notifyRequestClaimed(requestId, partner.getId(), partnerName, responseDto);

        return WorkRequestClaimResponseDto.success(responseDto);
    }

    /**
     * Partner's assigned jobs: Active, Upcoming, and Completed.
     */
    @Transactional(readOnly = true)
    public List<WorkRequestResponseDto> getPartnerAssignedJobs(String partnerEmail, String statusFilter) {
        User partner = userRepository.findByEmail(partnerEmail.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Partner account not found"));

        List<WorkRequest> list;
        if (statusFilter != null && !statusFilter.isBlank() && !"ALL".equalsIgnoreCase(statusFilter)) {
            try {
                WorkRequestStatus st = WorkRequestStatus.valueOf(statusFilter.toUpperCase());
                list = workRequestRepository.findByAssignedPartnerIdAndStatusInOrderByCreatedAtDesc(
                        partner.getId(), List.of(st));
            } catch (Exception e) {
                list = workRequestRepository.findByAssignedPartnerIdOrderByCreatedAtDesc(partner.getId());
            }
        } else {
            list = workRequestRepository.findByAssignedPartnerIdOrderByCreatedAtDesc(partner.getId());
        }

        return list.stream().map(wr -> {
            WorkRequestResponseDto dto = toResponseDto(wr);
            dto.setCompletionOtp(null);
            return dto;
        }).collect(Collectors.toList());
    }

    // =========================================================================
    // 3. WORK PROGRESS TRANSITIONS (PARTNER EXECUTION FLOW)
    // =========================================================================

    @Transactional
    public WorkRequestResponseDto startJourney(String requestId, String partnerEmail) {
        return transitionPartnerStage(requestId, partnerEmail,
                WorkRequestStatus.ASSIGNED, WorkRequestStatus.PARTNER_ON_THE_WAY, 3, "Partner is on the way to customer address",
                wr -> wr.setStartedJourneyAt(LocalDateTime.now()));
    }

    @Transactional
    public WorkRequestResponseDto arriveAtLocation(String requestId, String partnerEmail) {
        return transitionPartnerStage(requestId, partnerEmail,
                WorkRequestStatus.PARTNER_ON_THE_WAY, WorkRequestStatus.PARTNER_ARRIVED, 4, "Partner arrived at service location",
                wr -> wr.setArrivedAt(LocalDateTime.now()));
    }

    @Transactional
    public WorkRequestResponseDto startWork(String requestId, String partnerEmail) {
        return transitionPartnerStage(requestId, partnerEmail,
                WorkRequestStatus.PARTNER_ARRIVED, WorkRequestStatus.IN_PROGRESS, 4, "Partner started work execution",
                wr -> wr.setStartedWorkAt(LocalDateTime.now()));
    }

    @Transactional
    public WorkRequestResponseDto requestCompletion(String requestId, String partnerEmail) {
        return transitionPartnerStage(requestId, partnerEmail,
                WorkRequestStatus.IN_PROGRESS, WorkRequestStatus.AWAITING_CUSTOMER_APPROVAL, 5, "Partner completed work, awaiting customer OTP verification",
                null);
    }

    /**
     * Backward-compatible advance-stage endpoint supporting sequential flow.
     */
    @Transactional
    public WorkRequestResponseDto advanceStage(String requestId, String userEmail) {
        WorkRequest wr = workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found: " + requestId));

        validatePartnerOwnership(wr, userEmail);

        WorkRequestStatus current = wr.getStatus();
        WorkRequestStatus next;
        int nextStage;

        if (current == WorkRequestStatus.ASSIGNED) {
            next = WorkRequestStatus.PARTNER_ON_THE_WAY;
            nextStage = 3;
            wr.setStartedJourneyAt(LocalDateTime.now());
        } else if (current == WorkRequestStatus.PARTNER_ON_THE_WAY || current == WorkRequestStatus.IN_TRANSIT) {
            next = WorkRequestStatus.PARTNER_ARRIVED;
            nextStage = 4;
            wr.setArrivedAt(LocalDateTime.now());
        } else if (current == WorkRequestStatus.PARTNER_ARRIVED || current == WorkRequestStatus.ARRIVED) {
            next = WorkRequestStatus.IN_PROGRESS;
            nextStage = 4;
            wr.setStartedWorkAt(LocalDateTime.now());
        } else if (current == WorkRequestStatus.IN_PROGRESS) {
            next = WorkRequestStatus.AWAITING_CUSTOMER_APPROVAL;
            nextStage = 5;
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
                .notes("Partner advanced service status to " + next.name())
                .build());

        WorkRequestResponseDto dto = toResponseDto(wr);
        dto.setCompletionOtp(null);
        notificationService.notifyStageUpdated(requestId, dto);
        return dto;
    }

    private WorkRequestResponseDto transitionPartnerStage(
            String requestId,
            String partnerEmail,
            WorkRequestStatus expectedCurrent,
            WorkRequestStatus nextStatus,
            int nextStage,
            String notes,
            java.util.function.Consumer<WorkRequest> customUpdater) {

        WorkRequest wr = workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found: " + requestId));

        validatePartnerOwnership(wr, partnerEmail);

        WorkRequestStatus current = wr.getStatus();
        wr.setStatus(nextStatus);
        wr.setStage(nextStage);
        if (customUpdater != null) {
            customUpdater.accept(wr);
        }
        wr = workRequestRepository.save(wr);

        eventRepository.save(WorkRequestEvent.builder()
                .workRequest(wr)
                .fromStatus(current.name())
                .toStatus(nextStatus.name())
                .actor(wr.getAssignedPartner())
                .actorRole("PARTNER")
                .notes(notes)
                .build());

        WorkRequestResponseDto dto = toResponseDto(wr);
        dto.setCompletionOtp(null);
        notificationService.notifyStageUpdated(requestId, dto);
        return dto;
    }

    private void validatePartnerOwnership(WorkRequest wr, String callerEmail) {
        if (callerEmail == null || callerEmail.isBlank()) return;
        if (wr.getAssignedPartner() != null && wr.getAssignedPartner().getEmail() != null) {
            if (!wr.getAssignedPartner().getEmail().equalsIgnoreCase(callerEmail.trim())) {
                User caller = userRepository.findByEmail(callerEmail.trim().toLowerCase()).orElse(null);
                if (caller == null || caller.getRole() != Role.ROLE_ADMIN) {
                    throw new AccessDeniedException("You are not assigned to this work request");
                }
            }
        }
    }

    // =========================================================================
    // 4. COMPLETION VERIFICATION (SECURE OTP HMAC)
    // =========================================================================

    @Transactional
    public WorkRequestResponseDto verifyCompletion(String requestId, String partnerEmail, String completionOtp) {
        WorkRequest wr = workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found: " + requestId));

        validatePartnerOwnership(wr, partnerEmail);

        if (wr.getStatus() == WorkRequestStatus.COMPLETED) {
            return toResponseDto(wr);
        }
        if (wr.getStatus() == WorkRequestStatus.CANCELLED || wr.getStatus() == WorkRequestStatus.EXPIRED) {
            throw new ConflictException("Cannot verify completion for request in status: " + wr.getStatus(), "INVALID_STATUS");
        }

        // Verify and consume single-use OTP
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
                .fromStatus(prev != null ? prev.name() : null)
                .toStatus(WorkRequestStatus.COMPLETED.name())
                .actor(wr.getAssignedPartner())
                .actorRole("PARTNER")
                .notes("Work completion verified via customer completion OTP")
                .build());

        WorkRequestResponseDto dto = toResponseDto(wr);
        dto.setCompletionOtp(null);
        notificationService.notifyStageUpdated(requestId, dto);
        return dto;
    }

    @Transactional
    public Map<String, String> getCustomerCompletionOtp(String requestId, String customerEmail) {
        if (customerEmail == null || customerEmail.isBlank()) {
            throw new AccessDeniedException("Authentication required to access completion verification code.");
        }

        WorkRequest wr = workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found: " + requestId));

        User caller = userRepository.findByEmail(customerEmail.trim().toLowerCase())
                .orElseThrow(() -> new AccessDeniedException("Unrecognized caller identity."));

        boolean isAdmin = caller.getRole() == Role.ROLE_ADMIN;
        boolean isOwner = wr.getCustomerEmail() != null && wr.getCustomerEmail().equalsIgnoreCase(caller.getEmail());

        if (!isAdmin && !isOwner) {
            throw new AccessDeniedException("Access denied: Only the customer who booked this service can view the completion OTP.");
        }

        if (wr.getStatus() == WorkRequestStatus.COMPLETED || wr.getStatus() == WorkRequestStatus.CANCELLED) {
            throw new ConflictException("Completion OTP is not available for request in status: " + wr.getStatus(), "INVALID_STATUS");
        }

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

    // =========================================================================
    // 5. CUSTOMER QUERIES, CANCELLATION & DISPUTE
    // =========================================================================

    @Transactional(readOnly = true)
    public WorkRequestResponseDto getWorkRequestById(String id, String callerEmail) {
        WorkRequest wr = workRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found: " + id));

        if (callerEmail == null || callerEmail.isBlank()) {
            throw new AccessDeniedException("Authentication required to view work request details.");
        }

        User caller = userRepository.findByEmail(callerEmail.trim().toLowerCase())
                .orElseThrow(() -> new AccessDeniedException("Unrecognized caller identity."));

        boolean isAdmin = caller.getRole() == Role.ROLE_ADMIN;
        boolean isCustomer = wr.getCustomerEmail() != null && wr.getCustomerEmail().equalsIgnoreCase(caller.getEmail());
        boolean isAssignedPartner = wr.getAssignedPartner() != null && wr.getAssignedPartner().getId().equals(caller.getId());

        if (!isAdmin && !isCustomer && !isAssignedPartner) {
            throw new AccessDeniedException("Access denied: You are not authorized to view work request " + id);
        }

        WorkRequestResponseDto dto = toResponseDto(wr);

        // Security requirement: NEVER reveal completion OTP to partner.
        if (isCustomer || isAdmin) {
            if (wr.getStatus() != WorkRequestStatus.COMPLETED && wr.getStatus() != WorkRequestStatus.CANCELLED) {
                String activeOtp = otpSecurityService.getActiveOtpForCustomer(id);
                if (activeOtp == null) {
                    activeOtp = otpSecurityService.generateAndStoreOtp(wr);
                }
                dto.setCompletionOtp(activeOtp);
            }
        } else {
            dto.setCompletionOtp(null);
        }

        return dto;
    }

    public WorkRequestResponseDto getWorkRequestById(String id) {
        return getWorkRequestById(id, null);
    }

    @Transactional(readOnly = true)
    public List<WorkRequestResponseDto> getWorkRequests(String callerEmail, String filterEmail) {
        if (callerEmail == null || callerEmail.isBlank()) {
            throw new AccessDeniedException("Authentication required to access work requests.");
        }

        User caller = userRepository.findByEmail(callerEmail.trim().toLowerCase())
                .orElseThrow(() -> new AccessDeniedException("Unrecognized caller identity."));

        List<WorkRequest> list;
        if (caller.getRole() == Role.ROLE_ADMIN) {
            if (filterEmail != null && !filterEmail.isBlank()) {
                list = workRequestRepository.findByCustomerEmailOrderByCreatedAtDesc(filterEmail.trim().toLowerCase());
            } else {
                list = workRequestRepository.findAllByOrderByCreatedAtDesc();
            }
        } else if (caller.getRole() == Role.ROLE_CUSTOMER) {
            list = workRequestRepository.findByCustomerEmailOrderByCreatedAtDesc(caller.getEmail());
        } else if (caller.getRole() == Role.ROLE_PARTNER) {
            list = workRequestRepository.findByAssignedPartnerIdOrderByCreatedAtDesc(caller.getId());
        } else {
            throw new AccessDeniedException("Access denied: Unauthorized role.");
        }

        List<WorkRequestResponseDto> result = new ArrayList<>();
        for (WorkRequest wr : list) {
            WorkRequestResponseDto dto = toResponseDto(wr);
            dto.setCompletionOtp(null);
            result.add(dto);
        }
        return result;
    }

    public List<WorkRequestResponseDto> getWorkRequests(String email) {
        return getWorkRequests(email, null);
    }

    @Transactional
    public WorkRequestResponseDto cancelWorkRequest(String requestId, String userEmail, String reason) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new AccessDeniedException("Authentication required to cancel a work request.");
        }

        WorkRequest wr = workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found: " + requestId));

        User caller = userRepository.findByEmail(userEmail.trim().toLowerCase())
                .orElseThrow(() -> new AccessDeniedException("Unrecognized caller identity."));

        boolean isAdmin = caller.getRole() == Role.ROLE_ADMIN;
        boolean isOwner = wr.getCustomerEmail() != null && wr.getCustomerEmail().equalsIgnoreCase(caller.getEmail());

        if (!isAdmin && !isOwner) {
            throw new AccessDeniedException("Access denied: You are not authorized to cancel this work request.");
        }

        if (wr.getStatus() == WorkRequestStatus.CANCELLED) {
            return toResponseDto(wr);
        }

        if (wr.getStatus() == WorkRequestStatus.COMPLETED) {
            throw new ConflictException("Cannot cancel an already completed work request.", "COMPLETED_REQUEST");
        }

        if (wr.getStatus() == WorkRequestStatus.IN_PROGRESS && !isAdmin) {
            throw new ConflictException("Technician is currently performing service. Please contact customer support to cancel an in-progress request.", "IN_PROGRESS_DISPUTE");
        }

        WorkRequestStatus prev = wr.getStatus();
        wr.setStatus(WorkRequestStatus.CANCELLED);
        wr.setStage(6);
        wr.setCancellationReason(reason != null ? InputSanitizer.sanitize(reason) : "Cancelled by user");
        wr.setCancelledByRole(isAdmin ? "ADMIN" : "CUSTOMER");
        wr.setCancelledAt(LocalDateTime.now());
        wr = workRequestRepository.save(wr);

        eventRepository.save(WorkRequestEvent.builder()
                .workRequest(wr)
                .fromStatus(prev != null ? prev.name() : null)
                .toStatus(WorkRequestStatus.CANCELLED.name())
                .actor(caller)
                .actorRole(isAdmin ? "ADMIN" : "CUSTOMER")
                .notes("Work request cancelled: " + wr.getCancellationReason())
                .build());

        WorkRequestResponseDto dto = toResponseDto(wr);
        notificationService.notifyStageUpdated(requestId, dto);
        return dto;
    }

    public WorkRequestResponseDto cancelWorkRequest(String requestId, String userEmail) {
        return cancelWorkRequest(requestId, userEmail, null);
    }

    @Transactional
    public WorkRequestResponseDto raiseDispute(String requestId, String userEmail, String disputeReason) {
        WorkRequest wr = workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found: " + requestId));

        User caller = userRepository.findByEmail(userEmail.trim().toLowerCase())
                .orElseThrow(() -> new AccessDeniedException("Unrecognized caller identity."));

        WorkRequestStatus prev = wr.getStatus();
        wr.setStatus(WorkRequestStatus.DISPUTED);
        wr.setDisputeReason(disputeReason != null ? InputSanitizer.sanitize(disputeReason) : "Dispute raised");
        wr.setDisputedAt(LocalDateTime.now());
        wr = workRequestRepository.save(wr);

        eventRepository.save(WorkRequestEvent.builder()
                .workRequest(wr)
                .fromStatus(prev != null ? prev.name() : null)
                .toStatus(WorkRequestStatus.DISPUTED.name())
                .actor(caller)
                .actorRole(caller.getRole() != null ? caller.getRole().name().replace("ROLE_", "") : "USER")
                .notes("Dispute raised: " + wr.getDisputeReason())
                .build());

        WorkRequestResponseDto dto = toResponseDto(wr);
        notificationService.notifyStageUpdated(requestId, dto);
        return dto;
    }

    @Transactional
    public WorkRequestResponseDto processPayment(String requestId, String paymentMethod, String userEmail) {
        WorkRequest wr = workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found: " + requestId));

        BigDecimal grossAmount = wr.getEstimatedCost() != null ? wr.getEstimatedCost() : new BigDecimal("499.00");
        paymentAndLedgerService.settleWorkRequestPayment(requestId, paymentMethod, grossAmount, userEmail);

        wr = workRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalStateException("Reload failed for: " + requestId));

        WorkRequestResponseDto dto = toResponseDto(wr);
        notificationService.notifyStageUpdated(requestId, dto);
        return dto;
    }

    // =========================================================================
    // 6. ADMIN PORTAL: OVERVIEW STATISTICS & ADVANCED MANAGEMENT
    // =========================================================================

    @Transactional(readOnly = true)
    public Map<String, Object> getAdminStatistics() {
        Map<String, Object> stats = new LinkedHashMap<>();

        long total = workRequestRepository.count();
        long posted = workRequestRepository.countByStatusIn(List.of(
                WorkRequestStatus.POSTED, WorkRequestStatus.BROADCASTED));
        long assigned = workRequestRepository.countByStatus(WorkRequestStatus.ASSIGNED);
        long onTheWay = workRequestRepository.countByStatusIn(List.of(
                WorkRequestStatus.PARTNER_ON_THE_WAY, WorkRequestStatus.IN_TRANSIT,
                WorkRequestStatus.PARTNER_ARRIVED, WorkRequestStatus.ARRIVED));
        long inProgress = workRequestRepository.countByStatus(WorkRequestStatus.IN_PROGRESS);
        long awaitingApproval = workRequestRepository.countByStatus(WorkRequestStatus.AWAITING_CUSTOMER_APPROVAL);
        long completed = workRequestRepository.countByStatusIn(List.of(
                WorkRequestStatus.COMPLETED, WorkRequestStatus.CLOSED));
        long cancelled = workRequestRepository.countByStatus(WorkRequestStatus.CANCELLED);
        long disputed = workRequestRepository.countByStatus(WorkRequestStatus.DISPUTED);

        stats.put("totalRequests", total);
        stats.put("postedRequests", posted);
        stats.put("assignedRequests", assigned);
        stats.put("onTheWayRequests", onTheWay);
        stats.put("inProgressRequests", inProgress);
        stats.put("awaitingApprovalRequests", awaitingApproval);
        stats.put("completedRequests", completed);
        stats.put("cancelledRequests", cancelled);
        stats.put("disputedRequests", disputed);

        BigDecimal totalRevenue = workRequestRepository.sumTotalPaidRevenue();
        BigDecimal platformFees = workRequestRepository.sumTotalPlatformFee();
        BigDecimal partnerEarnings = workRequestRepository.sumTotalPartnerNetEarning();

        stats.put("totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO);
        stats.put("platformFees", platformFees != null ? platformFees : BigDecimal.ZERO);
        stats.put("partnerEarnings", partnerEarnings != null ? partnerEarnings : BigDecimal.ZERO);

        return stats;
    }

    @Transactional(readOnly = true)
    public Page<WorkRequestResponseDto> getAdminWorkRequests(
            String statusFilter,
            String categoryFilter,
            String search,
            Pageable pageable) {

        Page<WorkRequest> page;
        if (statusFilter != null && !statusFilter.isBlank() && !"ALL".equalsIgnoreCase(statusFilter)) {
            try {
                WorkRequestStatus st = WorkRequestStatus.valueOf(statusFilter.toUpperCase());
                page = workRequestRepository.findByStatusOrderByCreatedAtDesc(st, pageable);
            } catch (Exception e) {
                page = workRequestRepository.findAllByOrderByCreatedAtDesc(pageable);
            }
        } else {
            page = workRequestRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        return page.map(this::toResponseDto);
    }

    @Transactional(readOnly = true)
    public List<WorkRequestEvent> getWorkRequestEvents(String requestId) {
        return eventRepository.findByWorkRequestIdOrderByCreatedAtAsc(requestId);
    }

    @Transactional
    public Optional<WorkRequestResponseDto> adminOverrideStatus(
            String id,
            String newStatusStr,
            String reason,
            String adminActor) {

        return workRequestRepository.findById(id).map(wr -> {
            WorkRequestStatus prev = wr.getStatus();
            try {
                WorkRequestStatus newStatus = WorkRequestStatus.valueOf(newStatusStr.toUpperCase());
                wr.setStatus(newStatus);
            } catch (Exception e) {
                log.warn("Invalid override status: {}", newStatusStr);
            }

            wr = workRequestRepository.save(wr);

            eventRepository.save(WorkRequestEvent.builder()
                    .workRequest(wr)
                    .fromStatus(prev != null ? prev.name() : "UNKNOWN")
                    .toStatus(wr.getStatus().name())
                    .actorRole("ADMIN")
                    .notes("Admin manual override: " + (reason != null ? reason : "Manual administrative intervention"))
                    .build());

            WorkRequestResponseDto dto = toResponseDto(wr);
            notificationService.notifyStageUpdated(id, dto);
            return dto;
        });
    }

    // =========================================================================
    // 7. UTILITIES & DISTANCE CALCULATION
    // =========================================================================

    /**
     * Haversine formula to compute geodesic distance in kilometers between two GPS coordinates.
     */
    public static double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth's mean radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Legacy reject method (idempotent no-op for backwards compatibility).
     */
    @Transactional
    public Map<String, Object> rejectWorkRequest(String requestId, String partnerEmail) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Job dismissed");
        response.put("requestId", requestId);
        return response;
    }

    /**
     * Legacy getPartnerFeed method (redirects to getPartnerAllJobs).
     */
    @Transactional(readOnly = true)
    public List<WorkRequestResponseDto> getPartnerFeed(String partnerEmail, String category) {
        return getPartnerAllJobs(partnerEmail, category);
    }

    /**
     * Legacy claimWorkRequest (redirects to acceptJobAtomically).
     */
    @Transactional
    public WorkRequestClaimResponseDto claimWorkRequest(String requestId, String partnerEmail) {
        return acceptJobAtomically(requestId, partnerEmail);
    }
}
