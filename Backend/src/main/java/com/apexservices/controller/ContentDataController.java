package com.apexservices.controller;

import com.apexservices.dto.request.*;
import com.apexservices.dto.response.*;
import com.apexservices.model.Category;
import com.apexservices.model.Icon;
import com.apexservices.model.PartnerProfile;
import com.apexservices.model.Review;
import com.apexservices.security.InputSanitizer;
import com.apexservices.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(exposedHeaders = {"ETag", "Cache-Control"})
public class ContentDataController {

    private final SiteContentService siteContentService;
    private final CategoryService categoryService;
    private final IconService iconService;
    private final WorkRequestService workRequestService;
    private final PartnerPresenceService presenceService;
    private final ReviewService reviewService;
    private final PartnerProfileService partnerProfileService;
    private final ContentVersionService contentVersionService;
    private final PlatformConfigService platformConfigService;

    public void bumpContentVersion() {
        if (contentVersionService != null) {
            contentVersionService.bumpVersion();
        }
    }

    // --- FULL PRESENTATION DATA ENDPOINT WITH ETAG & DTO ---
    @GetMapping("/data")
    public ResponseEntity<BootstrapDataResponseDto> getFullData(
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) {
        String etag = contentVersionService.getDataEtag();
        if (contentVersionService.matches(ifNoneMatch, etag)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
                    .eTag(etag)
                    .header("Cache-Control", "public, max-age=60, must-revalidate")
                    .build();
        }

        List<Map<String, Object>> categories = categoryService.getCategories();
        BootstrapDataResponseDto dto = siteContentService.buildBootstrapDto(categories);

        return ResponseEntity.ok()
                .eTag(etag)
                .header("Cache-Control", "public, max-age=60, must-revalidate")
                .body(dto);
    }

    // --- MODULAR PUBLIC ENDPOINTS ---
    @GetMapping("/bootstrap/config")
    public ResponseEntity<Map<String, Object>> getBootstrapConfig(
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) {
        String etag = contentVersionService.getConfigEtag();
        if (contentVersionService.matches(ifNoneMatch, etag)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(etag).build();
        }
        Map<String, Object> cfg = siteContentService.buildModularConfig();
        return ResponseEntity.ok()
                .eTag(etag)
                .header("Cache-Control", "public, max-age=60, must-revalidate")
                .body(cfg);
    }

    @GetMapping("/catalog/categories")
    public ResponseEntity<List<Map<String, Object>>> getCatalogCategories(
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) {
        String etag = contentVersionService.getCategoryEtag();
        if (contentVersionService.matches(ifNoneMatch, etag)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(etag).build();
        }
        return ResponseEntity.ok()
                .eTag(etag)
                .header("Cache-Control", "public, max-age=60, must-revalidate")
                .body(categoryService.getCategories());
    }

    // --- ADMIN SETTINGS & BRANDING ---
    @GetMapping({"/admin/settings", "/settings"})
    public ResponseEntity<Map<String, Object>> getSettings() {
        return ResponseEntity.ok(siteContentService.getSettings());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping({"/admin/settings", "/settings"})
    public ResponseEntity<Map<String, Object>> updateSettings(@RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(siteContentService.updateSettings(updates));
    }

    // --- ICONS CRUD (SYSTEM & CUSTOM) ---
    @GetMapping("/icons")
    public ResponseEntity<List<Icon>> getIcons() {
        return ResponseEntity.ok(iconService.getAllIcons());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/icons")
    public ResponseEntity<Icon> addIcon(@RequestBody Map<String, Object> body) {
        String iconValue = (String) body.get("iconValue");
        if (iconValue == null || iconValue.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Icon saved = iconService.addIcon(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // --- CATEGORIES CRUD WITH ICON RELATIONSHIP ---
    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, Object>>> getCategories(
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) {
        String etag = contentVersionService.getCategoryEtag();
        if (contentVersionService.matches(ifNoneMatch, etag)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
                    .eTag(etag)
                    .header("Cache-Control", "public, max-age=60, must-revalidate")
                    .build();
        }
        return ResponseEntity.ok()
                .eTag(etag)
                .header("Cache-Control", "public, max-age=60, must-revalidate")
                .body(categoryService.getCategories());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/service-categories")
    public ResponseEntity<List<ServiceCategoryDto>> getAdminServiceCategories(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active) {
        return ResponseEntity.ok(categoryService.getAdminServiceCategories(search, active));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/service-categories")
    public ResponseEntity<?> createAdminServiceCategory(@Valid @RequestBody CategoryRequestDto body) {
        ServiceCategoryDto dto = categoryService.createAdminServiceCategory(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/service-categories/{id}")
    public ResponseEntity<?> updateAdminServiceCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequestDto body) {
        ServiceCategoryDto dto = categoryService.updateAdminServiceCategory(id, body);
        return ResponseEntity.ok(dto);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping({"/admin/service-categories/{id}/status", "/categories/{id}/status"})
    public ResponseEntity<?> toggleCategoryStatus(@PathVariable Long id, @RequestBody(required = false) CategoryStatusRequest req) {
        ServiceCategoryDto dto = categoryService.toggleCategoryStatus(id, req);
        return ResponseEntity.ok(dto);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/categories")
    public ResponseEntity<Map<String, Object>> addCategory(@Valid @RequestBody CategoryRequestDto body) {
        Map<String, Object> map = categoryService.addCategory(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(map);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/categories/{id}")
    public ResponseEntity<Map<String, Object>> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequestDto body) {
        Map<String, Object> map = categoryService.updateCategory(id, body);
        return ResponseEntity.ok(map);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping({"/admin/service-categories/{id}", "/categories/{id}"})
    public ResponseEntity<?> deleteCategory(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "false") boolean permanent) {
        Map<String, Object> res = categoryService.deleteCategory(id, permanent);
        if (permanent) {
            return ResponseEntity.ok(res);
        } else {
            return ResponseEntity.ok(res.get("serviceCategory"));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping({"/admin/service-categories/{id}/restore", "/categories/{id}/restore"})
    public ResponseEntity<?> restoreCategory(@PathVariable Long id) {
        ServiceCategoryDto dto = categoryService.restoreCategory(id);
        return ResponseEntity.ok(dto);
    }

    // --- SLIDES CRUD ---
    @GetMapping({"/slides", "/admin/slides"})
    public ResponseEntity<List<Map<String, Object>>> getSlides(
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) {
        String etag = contentVersionService.getConfigEtag();
        if (contentVersionService.matches(ifNoneMatch, etag)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
                    .eTag(etag)
                    .header("Cache-Control", "public, max-age=120, must-revalidate")
                    .build();
        }
        return ResponseEntity.ok()
                .eTag(etag)
                .header("Cache-Control", "public, max-age=120, must-revalidate")
                .body(siteContentService.getSlides());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping({"/slides", "/admin/slides"})
    public ResponseEntity<Map<String, Object>> addSlide(@RequestBody Map<String, Object> slide) {
        return ResponseEntity.status(HttpStatus.CREATED).body(siteContentService.addSlide(slide));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping({"/slides/{id}", "/admin/slides/{id}"})
    public ResponseEntity<Map<String, Object>> updateSlide(@PathVariable String id, @RequestBody Map<String, Object> slide) {
        return ResponseEntity.ok(siteContentService.updateSlide(id, slide));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping({"/slides/{id}", "/admin/slides/{id}"})
    public ResponseEntity<Void> deleteSlide(@PathVariable String id) {
        siteContentService.deleteSlide(id);
        return ResponseEntity.noContent().build();
    }

    // --- AI OWNER ---
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping({"/ai-owner", "/admin/ai-owner"})
    public ResponseEntity<Map<String, Object>> updateAiOwner(@RequestBody Map<String, Object> owner) {
        return ResponseEntity.ok(siteContentService.updateAiOwner(owner));
    }

    // --- REVIEWS CRUD ---
    @GetMapping({"/reviews", "/admin/reviews"})
    public ResponseEntity<List<Map<String, Object>>> getReviews() {
        return ResponseEntity.ok(siteContentService.getReviews());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping({"/reviews", "/admin/reviews"})
    public ResponseEntity<Map<String, Object>> addReview(@RequestBody Map<String, Object> review) {
        return ResponseEntity.status(HttpStatus.CREATED).body(siteContentService.addReview(review));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping({"/reviews/{id}", "/admin/reviews/{id}"})
    public ResponseEntity<Void> deleteReview(@PathVariable String id) {
        siteContentService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }

    // --- ANNOUNCEMENT ---
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping({"/announcement", "/admin/announcement"})
    public ResponseEntity<Map<String, Object>> updateAnnouncement(@RequestBody Map<String, Object> ann) {
        return ResponseEntity.ok(siteContentService.updateAnnouncement(ann));
    }

    // --- WORK REQUESTS ---
    @GetMapping({"/work-requests", "/work-requests/my"})
    public ResponseEntity<List<WorkRequestResponseDto>> getWorkRequests(
            @RequestParam(required = false) String email,
            Principal principal) {
        if (email != null && (!InputSanitizer.isSqlSafe(email) || !InputSanitizer.isXssSafe(email))) {
            return ResponseEntity.badRequest().build();
        }
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(workRequestService.getWorkRequests(principal.getName(), email));
    }

    @PostMapping("/work-requests")
    public ResponseEntity<?> createWorkRequest(
            @Valid @RequestBody WorkRequestDto requestDto,
            Principal principal) {
        if (platformConfigService != null && platformConfigService.isPlatformInMaintenance("customer_web")) {
            Map<String, Object> maint = platformConfigService.getMaintenanceStatus("customer_web");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "error", "Service booking is currently unavailable due to maintenance.",
                    "code", "MAINTENANCE_ACTIVE",
                    "maintenanceTitle", maint.getOrDefault("title", "Platform Maintenance in Progress"),
                    "message", maint.getOrDefault("message", "We are currently performing scheduled maintenance.")
            ));
        }
        String authEmail = principal != null ? principal.getName() : null;
        WorkRequestResponseDto created = workRequestService.createWorkRequest(requestDto, authEmail);
        contentVersionService.bumpWorkRequestVersion();
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/work-requests/{id}")
    public ResponseEntity<WorkRequestResponseDto> getWorkRequestById(
            @PathVariable String id,
            Principal principal) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(workRequestService.getWorkRequestById(id, principal.getName()));
    }

    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    @GetMapping({"/work-requests/partner-feed", "/work-requests/partner/feed"})
    public ResponseEntity<List<WorkRequestResponseDto>> getPartnerFeed(
            @RequestParam(required = false) String category,
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch,
            Principal principal) {
        String etag = contentVersionService.getWorkRequestEtag();
        if (contentVersionService.matches(ifNoneMatch, etag)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
                    .eTag(etag)
                    .header("Cache-Control", "private, no-cache")
                    .build();
        }
        String partnerEmail = principal.getName();
        return ResponseEntity.ok()
                .eTag(etag)
                .header("Cache-Control", "private, no-cache")
                .body(workRequestService.getPartnerFeed(partnerEmail, category));
    }

    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    @PostMapping("/work-requests/{id}/claim")
    public ResponseEntity<WorkRequestClaimResponseDto> claimWorkRequest(
            @PathVariable String id,
            Principal principal) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        String partnerEmail = principal.getName();
        WorkRequestClaimResponseDto result = workRequestService.claimWorkRequest(id, partnerEmail);
        contentVersionService.bumpWorkRequestVersion();
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    @PostMapping("/work-requests/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectWorkRequest(
            @PathVariable String id,
            Principal principal) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        String partnerEmail = principal.getName();
        Map<String, Object> res = workRequestService.rejectWorkRequest(id, partnerEmail);
        contentVersionService.bumpWorkRequestVersion();
        return ResponseEntity.ok(res);
    }

    @PostMapping("/work-requests/{id}/advance-stage")
    public ResponseEntity<WorkRequestResponseDto> advanceWorkRequestStage(
            @PathVariable String id,
            Principal principal) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        String userEmail = principal != null ? principal.getName() : null;
        WorkRequestResponseDto dto = workRequestService.advanceStage(id, userEmail);
        contentVersionService.bumpWorkRequestVersion();
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/work-requests/{id}/verify-completion")
    public ResponseEntity<WorkRequestResponseDto> verifyWorkRequestCompletion(
            @PathVariable String id,
            @RequestBody Map<String, String> payload,
            Principal principal) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        String otp = payload != null ? payload.get("completionOtp") : null;
        if (otp == null || otp.isBlank()) {
            otp = payload != null ? payload.get("otp") : null;
        }
        String partnerEmail = principal != null ? principal.getName() : null;
        WorkRequestResponseDto dto = workRequestService.verifyCompletion(id, partnerEmail, otp);
        contentVersionService.bumpWorkRequestVersion();
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/work-requests/{id}/completion-otp")
    public ResponseEntity<Map<String, String>> getCustomerCompletionOtp(
            @PathVariable String id,
            Principal principal) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(workRequestService.getCustomerCompletionOtp(id, principal.getName()));
    }

    @PostMapping("/work-requests/{id}/review")
    public ResponseEntity<Review> submitReview(
            @PathVariable String id,
            @RequestBody Map<String, Object> payload,
            Principal principal) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        int rating = payload.get("rating") != null ? Integer.parseInt(String.valueOf(payload.get("rating"))) : 5;
        String reviewText = payload.get("review") != null ? String.valueOf(payload.get("review"))
                : (payload.get("reviewText") != null ? String.valueOf(payload.get("reviewText")) : "");
        String customerEmail = principal != null ? principal.getName() : null;
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.submitReview(id, rating, reviewText, customerEmail));
    }

    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    @PostMapping(value = "/partners/profile/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadPartnerAvatar(
            @RequestParam("file") MultipartFile file,
            Principal principal) {
        String avatarUrl = partnerProfileService.uploadAvatar(principal.getName(), file);
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("avatarUrl", avatarUrl);
        return ResponseEntity.ok(res);
    }

    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    @GetMapping("/partners/profile")
    public ResponseEntity<PartnerProfile> getPartnerProfile(Principal principal) {
        return ResponseEntity.ok(partnerProfileService.getOrCreatePartnerProfile(principal.getName()));
    }

    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    @PutMapping("/partners/profile")
    public ResponseEntity<PartnerProfile> updatePartnerProfile(
            @RequestBody Map<String, Object> updates,
            Principal principal) {
        return ResponseEntity.ok(partnerProfileService.updateProfile(principal.getName(), updates));
    }

    @GetMapping("/public/avatars/{fileName:.+}")
    public ResponseEntity<Resource> getAvatarFile(@PathVariable String fileName) {
        if (!InputSanitizer.isSqlSafe(fileName) || fileName.contains("..")) {
            return ResponseEntity.badRequest().build();
        }
        try {
            Path filePath = Paths.get("uploads/avatars").resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType != null ? contentType : "image/jpeg"))
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/work-requests/{id}/cancel")
    public ResponseEntity<WorkRequestResponseDto> cancelWorkRequest(
            @PathVariable String id,
            Principal principal) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        WorkRequestResponseDto dto = workRequestService.cancelWorkRequest(id, principal.getName());
        contentVersionService.bumpWorkRequestVersion();
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/work-requests/{id}/raise-dispute")
    public ResponseEntity<WorkRequestResponseDto> raiseDispute(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> payload,
            Principal principal) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String reason = payload != null ? payload.get("reason") : "Customer dispute raised";
        WorkRequestResponseDto dto = workRequestService.raiseDispute(id, principal.getName(), reason);
        contentVersionService.bumpWorkRequestVersion();
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/work-requests/{id}/pay")
    public ResponseEntity<WorkRequestResponseDto> payWorkRequest(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> payload,
            Principal principal) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        String method = payload != null && payload.get("method") != null ? String.valueOf(payload.get("method")) : "UPI";
        String userEmail = principal != null ? principal.getName() : null;
        WorkRequestResponseDto dto = workRequestService.processPayment(id, method, userEmail);
        contentVersionService.bumpWorkRequestVersion();
        return ResponseEntity.ok(dto);
    }

    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    @PostMapping("/partners/availability")
    public ResponseEntity<Map<String, Object>> updatePartnerAvailability(
            @RequestBody Map<String, Object> payload,
            Principal principal) {
        boolean available = Boolean.parseBoolean(String.valueOf(payload.getOrDefault("available", "true")));
        boolean online = Boolean.parseBoolean(String.valueOf(payload.getOrDefault("online", "true")));
        String category = String.valueOf(payload.getOrDefault("category", "All"));

        presenceService.updatePresence(0L, principal.getName(), online, available, category);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("online", online);
        res.put("available", available);
        res.put("category", category);
        return ResponseEntity.ok(res);
    }
}
