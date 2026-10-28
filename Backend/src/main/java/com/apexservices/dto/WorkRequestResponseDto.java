package com.apexservices.dto;

import com.apexservices.model.WorkRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkRequestResponseDto {

    private String id;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String contactPhone;
    private String serviceCategory;
    private Long serviceCategoryId;
    private String serviceAddress;
    private String problemTitle;
    private String problemDescription;
    private String photoUrl;
    private String urgency;
    private String preferredDate;
    private String preferredTime;
    private BigDecimal estimatedCost;
    private String status;
    private int stage;

    // Assigned Partner Information
    private Long assignedPartnerId;
    private String assignedPartnerName;
    private String assignedPartnerPhone;
    private String assignedPartnerRating;
    private String assignedPartnerPhoto;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime claimedAt;
    private LocalDateTime completedAt;

    // Financial & Settlement Tracking
    private String paymentStatus;
    private LocalDateTime paidAt;
    private BigDecimal paidAmount;
    private BigDecimal platformFee;
    private BigDecimal partnerNetEarning;
    private String paymentMethod;

    // Server-Authoritative Remaining Seconds (Derived)
    private Long remainingSeconds;

    // Secure Customer Completion Verification Code
    private String completionOtp;

    public static WorkRequestResponseDto fromEntity(WorkRequest wr) {
        if (wr == null) return null;

        Long remainingSecs = null;
        if (wr.getExpiresAt() != null) {
            long diff = Duration.between(LocalDateTime.now(), wr.getExpiresAt()).getSeconds();
            remainingSecs = Math.max(0, diff);
        }

        return WorkRequestResponseDto.builder()
                .id(wr.getId())
                .customerId(wr.getCustomer() != null ? wr.getCustomer().getId() : null)
                .customerName(wr.getCustomerName())
                .customerEmail(wr.getCustomerEmail())
                .contactPhone(wr.getContactPhone())
                .serviceCategory(wr.getServiceCategory())
                .serviceCategoryId(wr.getServiceCategoryId())
                .serviceAddress(wr.getServiceAddress())
                .problemTitle(wr.getProblemTitle())
                .problemDescription(wr.getProblemDescription())
                .photoUrl(wr.getPhotoUrl())
                .urgency(wr.getUrgency())
                .preferredDate(wr.getPreferredDate())
                .preferredTime(wr.getPreferredTime())
                .estimatedCost(wr.getEstimatedCost())
                .status(wr.getStatus() != null ? wr.getStatus().name() : null)
                .stage(wr.getStage())
                .assignedPartnerId(wr.getAssignedPartner() != null ? wr.getAssignedPartner().getId() : null)
                .assignedPartnerName(wr.getAssignedPartnerName())
                .assignedPartnerPhone(wr.getAssignedPartnerPhone())
                .assignedPartnerRating(wr.getAssignedPartnerRating())
                .assignedPartnerPhoto(wr.getAssignedPartnerPhoto())
                .createdAt(wr.getCreatedAt())
                .updatedAt(wr.getUpdatedAt())
                .expiresAt(wr.getExpiresAt())
                .claimedAt(wr.getClaimedAt())
                .completedAt(wr.getCompletedAt())
                .paymentStatus(wr.getPaymentStatus() != null ? wr.getPaymentStatus() : "UNPAID")
                .paidAt(wr.getPaidAt())
                .paidAmount(wr.getPaidAmount())
                .platformFee(wr.getPlatformFee())
                .partnerNetEarning(wr.getPartnerNetEarning())
                .paymentMethod(wr.getPaymentMethod())
                .remainingSeconds(remainingSecs)
                .build();
    }
}
