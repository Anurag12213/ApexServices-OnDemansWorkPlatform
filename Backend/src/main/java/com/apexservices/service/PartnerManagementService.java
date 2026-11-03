package com.apexservices.service;

import com.apexservices.model.PartnerDocument;
import com.apexservices.model.PartnerPayout;
import com.apexservices.model.User;
import com.apexservices.repository.PartnerDocumentRepository;
import com.apexservices.repository.PartnerPayoutRepository;
import com.apexservices.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartnerManagementService {

    private final PartnerDocumentRepository documentRepository;
    private final PartnerPayoutRepository payoutRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public List<PartnerDocument> getPartnerDocuments(Long partnerId) {
        return documentRepository.findByPartnerIdOrderByUploadedAtDesc(partnerId);
    }

    public List<PartnerDocument> getAllDocuments() {
        return documentRepository.findAll();
    }

    @Transactional
    public PartnerDocument uploadDocument(Long partnerId, String docType, String docName, String docUrl) {
        User partner = userRepository.findById(partnerId)
                .orElseThrow(() -> new IllegalArgumentException("Partner not found: " + partnerId));

        PartnerDocument doc = PartnerDocument.builder()
                .id("DOC-" + (System.currentTimeMillis() % 1000000))
                .partner(partner)
                .documentType(docType != null ? docType : "AADHAAR")
                .documentName(docName != null ? docName : "Identity Document")
                .documentUrl(docUrl != null ? docUrl : "https://storage.apexservices.com/docs/" + UUID.randomUUID())
                .status("PENDING_REVIEW")
                .uploadedAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        PartnerDocument saved = documentRepository.save(doc);

        auditLogService.record(
                partnerId.toString(),
                "PARTNER",
                "DOCUMENT_UPLOADED",
                "PARTNER_KYC",
                saved.getId(),
                "Uploaded KYC document: " + doc.getDocumentName(),
                "127.0.0.1"
        );

        return saved;
    }

    @Transactional
    public PartnerDocument reviewDocument(String docId, String status, String rejectionReason, String verifiedBy) {
        return reviewDocument(null, docId, status, rejectionReason, verifiedBy);
    }

    @Transactional
    public PartnerDocument reviewDocument(Long partnerId, String docId, String status, String rejectionReason, String verifiedBy) {
        PartnerDocument doc = documentRepository.findById(docId).orElse(null);

        if (doc == null && partnerId != null) {
            User partner = userRepository.findById(partnerId)
                    .orElseThrow(() -> new IllegalArgumentException("Partner not found: " + partnerId));

            String docName = docId.toLowerCase().contains("skill") || docId.toLowerCase().contains("cert")
                    ? "Trade Skill Certification"
                    : "Government Aadhaar / ID";
            String docType = docId.toLowerCase().contains("skill") ? "CERTIFICATION" : "AADHAAR";

            doc = PartnerDocument.builder()
                    .id(docId)
                    .partner(partner)
                    .documentType(docType)
                    .documentName(docName)
                    .documentUrl("https://storage.apexservices.com/docs/" + docId)
                    .status(status)
                    .rejectionReason(rejectionReason)
                    .verifiedBy(verifiedBy != null ? verifiedBy : "ADMIN")
                    .verifiedAt(LocalDateTime.now())
                    .uploadedAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            PartnerDocument saved = documentRepository.save(doc);

            auditLogService.record(
                    verifiedBy != null ? verifiedBy : "ADMIN",
                    "ADMIN",
                    "DOCUMENT_" + status,
                    "PARTNER_KYC",
                    docId,
                    "Partner KYC document " + doc.getDocumentName() + " created and marked as " + status + (rejectionReason != null ? " Reason: " + rejectionReason : ""),
                    "127.0.0.1"
            );

            return saved;
        }

        if (doc == null) {
            throw new IllegalArgumentException("Document not found: " + docId);
        }

        doc.setStatus(status); // VERIFIED, REJECTED, PENDING_REVIEW, UNDER_REVIEW
        doc.setRejectionReason(rejectionReason);
        doc.setVerifiedBy(verifiedBy != null ? verifiedBy : "ADMIN");
        doc.setVerifiedAt(LocalDateTime.now());
        doc.setUpdatedAt(LocalDateTime.now());

        PartnerDocument saved = documentRepository.save(doc);

        auditLogService.record(
                verifiedBy != null ? verifiedBy : "ADMIN",
                "ADMIN",
                "DOCUMENT_" + status,
                "PARTNER_KYC",
                docId,
                "Partner document " + doc.getDocumentName() + " marked as " + status + (rejectionReason != null ? " Reason: " + rejectionReason : ""),
                "127.0.0.1"
        );

        return saved;
    }

    public List<PartnerPayout> getAllPayouts() {
        return payoutRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<PartnerPayout> getPartnerPayouts(Long partnerId) {
        return payoutRepository.findByPartnerIdOrderByCreatedAtDesc(partnerId);
    }

    @Transactional
    public PartnerPayout requestPayout(Long partnerId, BigDecimal amount, String method, String accountNumber) {
        User partner = userRepository.findById(partnerId)
                .orElseThrow(() -> new IllegalArgumentException("Partner not found: " + partnerId));

        PartnerPayout payout = PartnerPayout.builder()
                .id("PAY-" + (System.currentTimeMillis() % 1000000))
                .partner(partner)
                .partnerName(partner.getFullName() != null ? partner.getFullName() : "Partner")
                .amount(amount)
                .currency("INR")
                .payoutMethod(method != null ? method : "BANK_TRANSFER")
                .accountNumber(accountNumber)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        PartnerPayout saved = payoutRepository.save(payout);

        auditLogService.record(
                partnerId.toString(),
                "PARTNER",
                "PAYOUT_REQUESTED",
                "FINANCIAL_PAYOUT",
                saved.getId(),
                "Payout requested for ₹" + amount.toPlainString(),
                "127.0.0.1"
        );

        return saved;
    }

    @Transactional
    public PartnerPayout updatePayoutStatus(String payoutId, String action, String txnRef, String actor, String notes) {
        PartnerPayout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> new IllegalArgumentException("Payout not found: " + payoutId));

        if ("APPROVE".equalsIgnoreCase(action)) {
            payout.setStatus("APPROVED");
            payout.setApprovedBy(actor);
        } else if ("SETTLE".equalsIgnoreCase(action)) {
            payout.setStatus("SETTLED");
            payout.setTransactionReference(txnRef != null ? txnRef : "TXN-" + System.currentTimeMillis());
            payout.setSettledAt(LocalDateTime.now());
        } else if ("REJECT".equalsIgnoreCase(action)) {
            payout.setStatus("REJECTED");
        }

        if (notes != null) payout.setNotes(notes);

        PartnerPayout saved = payoutRepository.save(payout);

        auditLogService.record(
                actor != null ? actor : "ADMIN",
                "ADMIN",
                "PAYOUT_" + action.toUpperCase(),
                "FINANCIAL_PAYOUT",
                payoutId,
                "Payout " + payoutId + " status updated to " + payout.getStatus() + " (Ref: " + payout.getTransactionReference() + ")",
                "127.0.0.1"
        );

        return saved;
    }
}
