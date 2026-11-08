package com.apexservices.controller;

import com.apexservices.dto.response.WorkRequestResponseDto;
import com.apexservices.model.WorkRequestEvent;
import com.apexservices.service.ContentVersionService;
import com.apexservices.service.WorkRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/work-requests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminWorkRequestController {

    private final WorkRequestService workRequestService;
    private final ContentVersionService contentVersionService;

    /**
     * Complete status-based listing for Admin Portal.
     */
    @GetMapping
    public ResponseEntity<Page<WorkRequestResponseDto>> getAdminWorkRequests(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)));
        return ResponseEntity.ok(workRequestService.getAdminWorkRequests(status, category, search, pageable));
    }

    /**
     * Authoritative lifecycle statistics for Admin Overview.
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        return ResponseEntity.ok(workRequestService.getAdminStatistics());
    }

    /**
     * Single work request details with full audit events and financial metadata.
     */
    @GetMapping("/{id}")
    public ResponseEntity<WorkRequestResponseDto> getRequestDetail(
            @PathVariable String id,
            Principal principal) {
        String adminEmail = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(workRequestService.getWorkRequestById(id, adminEmail));
    }

    /**
     * Complete lifecycle event timeline for a work request.
     */
    @GetMapping("/{id}/events")
    public ResponseEntity<List<WorkRequestEvent>> getRequestEvents(@PathVariable String id) {
        return ResponseEntity.ok(workRequestService.getWorkRequestEvents(id));
    }

    /**
     * Audited manual status override.
     */
    @PostMapping("/{id}/override")
    public ResponseEntity<?> overrideStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> payload,
            Principal principal) {
        String newStatus = payload.get("status");
        String reason = payload.getOrDefault("reason", "Administrative manual override");
        String adminEmail = principal != null ? principal.getName() : "ADMIN";

        return workRequestService.adminOverrideStatus(id, newStatus, reason, adminEmail)
                .map(res -> {
                    contentVersionService.bumpWorkRequestVersion();
                    return ResponseEntity.ok(res);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Administrative cancellation with audit trail.
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<WorkRequestResponseDto> adminCancel(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> payload,
            Principal principal) {
        String reason = payload != null ? payload.get("reason") : "Administrative cancellation";
        String adminEmail = principal != null ? principal.getName() : "ADMIN";

        WorkRequestResponseDto res = workRequestService.cancelWorkRequest(id, adminEmail, reason);
        contentVersionService.bumpWorkRequestVersion();
        return ResponseEntity.ok(res);
    }
}
