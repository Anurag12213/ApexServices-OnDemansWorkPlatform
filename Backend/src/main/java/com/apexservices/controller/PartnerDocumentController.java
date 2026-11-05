package com.apexservices.controller;

import com.apexservices.model.PartnerDocument;
import com.apexservices.service.PartnerManagementService;
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
@RequestMapping("/api/partners/documents")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://apexservices-admin-portal.netlify.app", "https://apexservicesondemand.netlify.app", "https://apexservices-partner-portal.netlify.app"})
public class PartnerDocumentController {

    private final PartnerManagementService partnerManagementService;

    @GetMapping
    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    public ResponseEntity<List<PartnerDocument>> getMyDocuments(Principal principal) {
        if (principal == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(partnerManagementService.getPartnerDocumentsByPrincipal(principal.getName()));
    }

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    public ResponseEntity<?> uploadDocument(@RequestBody Map<String, String> req, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();

        String docType = req.getOrDefault("documentType", "AADHAAR");
        String docName = req.getOrDefault("documentName", "Identification Certificate");
        String docUrl = req.get("documentUrl");

        try {
            PartnerDocument doc = partnerManagementService.uploadDocumentByPrincipal(principal.getName(), docType, docName, docUrl);
            return ResponseEntity.ok(doc);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
