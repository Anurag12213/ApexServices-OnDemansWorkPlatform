package com.apexservices.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "work_request_rejections",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_rejection_request_partner", columnNames = {"work_request_id", "partner_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkRequestRejection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_request_id", nullable = false)
    private WorkRequest workRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private User partner;

    @Column(name = "rejected_at", nullable = false)
    private LocalDateTime rejectedAt;

    @PrePersist
    protected void onCreate() {
        if (this.rejectedAt == null) {
            this.rejectedAt = LocalDateTime.now();
        }
    }
}
