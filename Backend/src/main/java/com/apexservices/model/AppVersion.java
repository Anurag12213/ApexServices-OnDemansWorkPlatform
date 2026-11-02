package com.apexservices.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_versions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppVersion {

    @Id
    @Column(name = "client_type", length = 50)
    private String clientType; // customer_web, partner_web, admin_web

    @Column(name = "client_name", nullable = false, length = 100)
    private String clientName;

    @Column(name = "current_version", nullable = false, length = 20)
    private String currentVersion;

    @Column(name = "min_required_version", nullable = false, length = 20)
    private String minRequiredVersion;

    @Builder.Default
    @Column(name = "force_update_enabled", nullable = false)
    private boolean forceUpdateEnabled = false;

    @Builder.Default
    @Column(name = "maintenance_mode", nullable = false)
    private boolean maintenanceMode = false;

    @Column(name = "prompt_title", length = 150)
    private String promptTitle;

    @Column(name = "prompt_message", length = 500)
    private String promptMessage;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.updatedAt = LocalDateTime.now();
    }
}
