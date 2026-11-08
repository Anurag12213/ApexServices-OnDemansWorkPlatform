package com.apexservices.controller;

import com.apexservices.dto.response.WorkRequestClaimResponseDto;
import com.apexservices.dto.response.WorkRequestResponseDto;
import com.apexservices.service.ContentVersionService;
import com.apexservices.service.WorkRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/partner")
@RequiredArgsConstructor
public class PartnerJobController {

    private final WorkRequestService workRequestService;
    private final ContentVersionService contentVersionService;

    /**
     * Post & Pick: All eligible partners can browse all published jobs.
     */
    @GetMapping("/jobs")
    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    public ResponseEntity<List<WorkRequestResponseDto>> getAllJobs(
            @RequestParam(required = false) String category,
            Principal principal) {
        String partnerEmail = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(workRequestService.getPartnerAllJobs(partnerEmail, category));
    }

    /**
     * Post & Pick: Nearby Jobs filtering based on distance and coordinates.
     */
    @GetMapping("/jobs/nearby")
    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    public ResponseEntity<List<WorkRequestResponseDto>> getNearbyJobs(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false, defaultValue = "50.0") Double radiusKm,
            @RequestParam(required = false) String category,
            Principal principal) {
        String partnerEmail = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(workRequestService.getPartnerNearbyJobs(partnerEmail, lat, lng, radiusKm, category));
    }

    /**
     * Job details: customer address & contact masked prior to acceptance.
     */
    @GetMapping("/jobs/{id}")
    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    public ResponseEntity<WorkRequestResponseDto> getJobDetail(
            @PathVariable String id,
            Principal principal) {
        String partnerEmail = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(workRequestService.getPartnerJobDetail(id, partnerEmail));
    }

    /**
     * Atomic Post and Pick Acceptance by first partner.
     */
    @PostMapping("/jobs/{id}/accept")
    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    public ResponseEntity<WorkRequestClaimResponseDto> acceptJob(
            @PathVariable String id,
            Principal principal) {
        String partnerEmail = principal != null ? principal.getName() : null;
        WorkRequestClaimResponseDto result = workRequestService.acceptJobAtomically(id, partnerEmail);
        contentVersionService.bumpWorkRequestVersion();
        return ResponseEntity.ok(result);
    }

    /**
     * Partner's assigned jobs: Active, Upcoming, and Completed.
     */
    @GetMapping("/jobs/accepted")
    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    public ResponseEntity<List<WorkRequestResponseDto>> getAcceptedJobs(
            @RequestParam(required = false) String status,
            Principal principal) {
        String partnerEmail = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(workRequestService.getPartnerAssignedJobs(partnerEmail, status));
    }

    @GetMapping("/jobs/history")
    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    public ResponseEntity<List<WorkRequestResponseDto>> getJobHistory(Principal principal) {
        String partnerEmail = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(workRequestService.getPartnerAssignedJobs(partnerEmail, "COMPLETED"));
    }

    // =========================================================================
    // PROGRESS LIFECYCLE TRANSITIONS
    // =========================================================================

    @PostMapping("/jobs/{id}/start-journey")
    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    public ResponseEntity<WorkRequestResponseDto> startJourney(
            @PathVariable String id,
            Principal principal) {
        String partnerEmail = principal != null ? principal.getName() : null;
        WorkRequestResponseDto dto = workRequestService.startJourney(id, partnerEmail);
        contentVersionService.bumpWorkRequestVersion();
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/jobs/{id}/arrived")
    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    public ResponseEntity<WorkRequestResponseDto> arrivedAtLocation(
            @PathVariable String id,
            Principal principal) {
        String partnerEmail = principal != null ? principal.getName() : null;
        WorkRequestResponseDto dto = workRequestService.arriveAtLocation(id, partnerEmail);
        contentVersionService.bumpWorkRequestVersion();
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/jobs/{id}/start-work")
    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    public ResponseEntity<WorkRequestResponseDto> startWork(
            @PathVariable String id,
            Principal principal) {
        String partnerEmail = principal != null ? principal.getName() : null;
        WorkRequestResponseDto dto = workRequestService.startWork(id, partnerEmail);
        contentVersionService.bumpWorkRequestVersion();
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/jobs/{id}/complete")
    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    public ResponseEntity<WorkRequestResponseDto> requestCompletion(
            @PathVariable String id,
            Principal principal) {
        String partnerEmail = principal != null ? principal.getName() : null;
        WorkRequestResponseDto dto = workRequestService.requestCompletion(id, partnerEmail);
        contentVersionService.bumpWorkRequestVersion();
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/location")
    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> updateLocation(
            @RequestBody Map<String, Object> locationData,
            Principal principal) {
        return ResponseEntity.ok(Map.of("success", true, "message", "Partner location updated"));
    }
}
