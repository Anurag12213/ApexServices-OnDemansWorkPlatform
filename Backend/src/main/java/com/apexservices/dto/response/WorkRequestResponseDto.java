package com.apexservices.dto.response;

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
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String houseDetails;
    private String landmark;
    private String cityPostal;
    private Double distanceKm;

    private String problemTitle;
    private String problemDescription;
    private String photoUrl;
    private String urgency;
    private String preferredDate;
    private String preferredTime;
    private BigDecimal estimatedCost;
    private BigDecimal quoteAmount;
    private String quoteNotes;
    private String status;
    private int stage;

    // Assigned Partner Information
    private Long assignedPartnerId;
    private String assignedPartnerName;
    private String assignedPartnerPhone;
    private String assignedPartnerRating;
    private String assignedPartnerPhoto;

    // Timestamps & Lifecycle Events
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime claimedAt;
    private LocalDateTime startedJourneyAt;
    private LocalDateTime arrivedAt;
    private LocalDateTime startedWorkAt;
    private LocalDateTime completedAt;
    private String cancellationReason;
    private String cancelledByRole;
    private LocalDateTime cancelledAt;
    private String disputeReason;
    private LocalDateTime disputedAt;

    // Financial & Settlement Tracking
    private String paymentStatus;
    private LocalDateTime paidAt;
    private BigDecimal paidAmount;
    private BigDecimal platformFee;
    private BigDecimal partnerNetEarning;
    private String paymentMethod;

    // Derived Remaining Seconds
    private Long remainingSeconds;

    // Secure Customer Completion Verification Code
    private String completionOtp;

    // Customer JWT Token (populated for guest bookings to authenticate client session)
    private String customerToken;

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
                .latitude(wr.getLatitude())
                .longitude(wr.getLongitude())
                .houseDetails(wr.getHouseDetails())
                .landmark(wr.getLandmark())
                .cityPostal(wr.getCityPostal())
                .problemTitle(wr.getProblemTitle())
                .problemDescription(wr.getProblemDescription())
                .photoUrl(wr.getPhotoUrl())
                .urgency(wr.getUrgency())
                .preferredDate(wr.getPreferredDate())
                .preferredTime(wr.getPreferredTime())
                .estimatedCost(wr.getEstimatedCost())
                .quoteAmount(wr.getQuoteAmount())
                .quoteNotes(wr.getQuoteNotes())
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
                .startedJourneyAt(wr.getStartedJourneyAt())
                .arrivedAt(wr.getArrivedAt())
                .startedWorkAt(wr.getStartedWorkAt())
                .completedAt(wr.getCompletedAt())
                .cancellationReason(wr.getCancellationReason())
                .cancelledByRole(wr.getCancelledByRole())
                .cancelledAt(wr.getCancelledAt())
                .disputeReason(wr.getDisputeReason())
                .disputedAt(wr.getDisputedAt())
                .paymentStatus(wr.getPaymentStatus() != null ? wr.getPaymentStatus() : "UNPAID")
                .paidAt(wr.getPaidAt())
                .paidAmount(wr.getPaidAmount())
                .platformFee(wr.getPlatformFee())
                .partnerNetEarning(wr.getPartnerNetEarning())
                .paymentMethod(wr.getPaymentMethod())
                .remainingSeconds(remainingSecs)
                .build();
    }

    /**
     * Creates a privacy-masked DTO for unassigned partners browsing the open marketplace.
     * Hides customer's full street address, phone number, and email until acceptance.
     */
    public static WorkRequestResponseDto forUnassignedPartner(WorkRequest wr, Double distanceKm) {
        WorkRequestResponseDto dto = fromEntity(wr);
        if (dto == null) return null;

        dto.setDistanceKm(distanceKm);
        dto.setCustomerName("Customer in " + (wr.getCityPostal() != null ? wr.getCityPostal() : "Local Area"));
        dto.setCustomerEmail(null);
        dto.setContactPhone(null);
        dto.setCompletionOtp(null);

        // Mask exact street address, show approximate area/locality
        String maskedAddress = wr.getLandmark() != null && !wr.getLandmark().isBlank()
                ? "Near " + wr.getLandmark() + (wr.getCityPostal() != null ? ", " + wr.getCityPostal() : "")
                : (wr.getCityPostal() != null ? "Area: " + wr.getCityPostal() : "Approximate Local Area (Full address shown upon acceptance)");
        dto.setServiceAddress(maskedAddress);
        dto.setHouseDetails(null);

        // Pre-compute partner net earning (80% default if not yet set)
        if (dto.getPartnerNetEarning() == null && dto.getEstimatedCost() != null) {
            dto.setPartnerNetEarning(dto.getEstimatedCost().multiply(new BigDecimal("0.80")).setScale(2, java.math.RoundingMode.HALF_UP));
        }

        return dto;
    }
}
