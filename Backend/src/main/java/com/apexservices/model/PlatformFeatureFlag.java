package com.apexservices.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "platform_feature_flags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformFeatureFlag {

    @Id
    @Column(name = "flag_key", length = 100)
    private String flagKey;

    @Column(name = "flag_name", nullable = false, length = 150)
    private String flagName;

    @Column(name = "description", length = 255)
    private String description;

    @Builder.Default
    @Column(name = "is_enabled", nullable = false)
    private boolean enabled = false;

    @Builder.Default
    @Column(name = "category", nullable = false, length = 50)
    private String category = "GENERAL";

    @Builder.Default
    @Column(name = "is_public", nullable = false)
    private boolean isPublic = false;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.updatedAt = LocalDateTime.now();
    }
}
