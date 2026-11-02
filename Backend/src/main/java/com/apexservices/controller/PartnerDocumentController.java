package com.apexservices.controller;

import com.apexservices.model.PartnerDocument;
import com.apexservices.model.User;
import com.apexservices.repository.UserRepository;
import com.apexservices.service.PartnerManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/partners/documents")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://apexservices-admin-portal.netlify.app", "https://apexservicesondemand.netlify.app", "https://apexservices-partner-portal.netlify.app"})
public class PartnerDocumentController {

    private final PartnerManagementService partnerManagementService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    public ResponseEntity<List<PartnerDocument>> getMyDocuments(Principal principal) {
        if (principal == null) return ResponseEntity.ok(List.of());
        return userRepository.findByIdentifier(principal.getName())
                .map(u -> ResponseEntity.ok(partnerManagementService.getPartnerDocuments(u.getId())))
                .orElse(ResponseEntity.ok(List.of()));
    }

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    public ResponseEntity<?> uploadDocument(@RequestBody Map<String, String> req, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();

        Optional<User> uOpt = userRepository.findByIdentifier(principal.getName());
        if (uOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "User not found"));

        String docType = req.getOrDefault("documentType", "AADHAAR");
        String docName = req.getOrDefault("documentName", "Identification Certificate");
        String docUrl = req.get("documentUrl");

        PartnerDocument doc = partnerManagementService.uploadDocument(uOpt.get().getId(), docType, docName, docUrl);
        return ResponseEntity.ok(doc);
    }
}
