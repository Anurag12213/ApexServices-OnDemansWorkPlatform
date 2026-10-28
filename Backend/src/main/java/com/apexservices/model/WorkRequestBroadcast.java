package com.apexservices.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "work_request_broadcasts",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_broadcast_request_partner", columnNames = {"work_request_id", "partner_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkRequestBroadcast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_request_id", nullable = false)
    private WorkRequest workRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private User partner;

    @Column(name = "notified_at", nullable = false)
    private LocalDateTime notifiedAt;

    @PrePersist
    protected void onCreate() {
        if (this.notifiedAt == null) {
            this.notifiedAt = LocalDateTime.now();
        }
    }
}
