package com.apexservices.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "work_requests",
    indexes = {
        @Index(name = "idx_wr_status", columnList = "status"),
        @Index(name = "idx_wr_category", columnList = "service_category"),
        @Index(name = "idx_wr_service_category_id", columnList = "service_category_id"),
        @Index(name = "idx_wr_customer_email", columnList = "customer_email"),
        @Index(name = "idx_wr_assigned_partner", columnList = "assigned_partner_id"),
        @Index(name = "idx_wr_expires_at", columnList = "expires_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkRequest {

    @Id
    @Column(name = "id", length = 50, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private User customer;

    @Column(name = "customer_name", nullable = false, length = 100)
    private String customerName;

    @Column(name = "customer_email", length = 255)
    private String customerEmail;

    @Column(name = "contact_phone", length = 50)
    private String contactPhone;

    @Column(name = "service_category", nullable = false, length = 100)
    private String serviceCategory;

    @Column(name = "service_category_id")
    private Long serviceCategoryId;

    @Column(name = "service_address", nullable = false, columnDefinition = "TEXT")
    private String serviceAddress;

    @Column(name = "problem_title", length = 200)
    private String problemTitle;

    @Column(name = "problem_description", nullable = false, columnDefinition = "TEXT")
    private String problemDescription;

    @Lob
    @Column(name = "photo_url", columnDefinition = "LONGTEXT")
    private String photoUrl;

    @Builder.Default
    @Column(name = "urgency", nullable = false, length = 50)
    private String urgency = "Standard";

    @Column(name = "preferred_date", length = 50)
    private String preferredDate;

    @Column(name = "preferred_time", length = 50)
    private String preferredTime;

    @Builder.Default
    @Column(name = "estimated_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal estimatedCost = new BigDecimal("499.00");

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private WorkRequestStatus status = WorkRequestStatus.BROADCASTED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_partner_id")
    private User assignedPartner;

    @Column(name = "assigned_partner_name", length = 100)
    private String assignedPartnerName;

    @Column(name = "assigned_partner_phone", length = 50)
    private String assignedPartnerPhone;

    @Column(name = "assigned_partner_rating", length = 50)
    private String assignedPartnerRating;

    @Lob
    @Column(name = "assigned_partner_photo", columnDefinition = "LONGTEXT")
    private String assignedPartnerPhoto;

    @Builder.Default
    @Column(name = "stage", nullable = false)
    private int stage = 1;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "claimed_at")
    private LocalDateTime claimedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Builder.Default
    @Column(name = "payment_status", length = 50)
    private String paymentStatus = "UNPAID";

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "paid_amount", precision = 10, scale = 2)
    private BigDecimal paidAmount;

    @Column(name = "platform_fee", precision = 10, scale = 2)
    private BigDecimal platformFee;

    @Column(name = "partner_net_earning", precision = 10, scale = 2)
    private BigDecimal partnerNetEarning;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        if (this.updatedAt == null) this.updatedAt = LocalDateTime.now();
        if (this.status == null) this.status = WorkRequestStatus.BROADCASTED;
        if (this.stage == 0) this.stage = 1;
        if (this.estimatedCost == null) this.estimatedCost = new BigDecimal("499.00");
        if (this.paymentStatus == null) this.paymentStatus = "UNPAID";
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
