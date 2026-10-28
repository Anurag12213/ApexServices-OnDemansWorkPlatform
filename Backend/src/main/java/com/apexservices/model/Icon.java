package com.apexservices.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "icons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Icon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Builder.Default
    @Column(name = "icon_type", nullable = false, length = 50)
    private String iconType = "SYSTEM"; // "SYSTEM" (Lucide icon name) or "CUSTOM" (Base64 / URL)

    @Lob
    @Column(name = "icon_value", nullable = false, columnDefinition = "LONGTEXT")
    private String iconValue; // "Hammer", "Wrench", or "data:image/png;base64,..." or URL

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        if (this.updatedAt == null) this.updatedAt = LocalDateTime.now();
        if (this.iconType == null) this.iconType = "SYSTEM";
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
