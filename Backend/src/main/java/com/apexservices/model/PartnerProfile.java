package com.apexservices.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "partner_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "avatar_key", length = 500)
    private String avatarKey;

    @Column(name = "operating_territory", length = 255)
    private String operatingTerritory;

    @Builder.Default
    @Column(name = "id_verification_status", length = 20, nullable = false)
    private String idVerificationStatus = "PENDING";

    @Builder.Default
    @Column(name = "background_verification_status", length = 20, nullable = false)
    private String backgroundVerificationStatus = "PENDING";

    @Builder.Default
    @Column(name = "training_verification_status", length = 20, nullable = false)
    private String trainingVerificationStatus = "PENDING";

    @Builder.Default
    @Column(name = "rating", precision = 3, scale = 2, nullable = false)
    private BigDecimal rating = new BigDecimal("5.00");

    @Builder.Default
    @Column(name = "review_count", nullable = false)
    private int reviewCount = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        if (this.updatedAt == null) this.updatedAt = LocalDateTime.now();
        if (this.rating == null) this.rating = new BigDecimal("5.00");
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
