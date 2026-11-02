package com.apexservices.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "coupon_redemptions",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_redemption_order", columnNames = {"coupon_id", "work_request_id"})
    },
    indexes = {
        @Index(name = "idx_redemption_user", columnList = "user_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponRedemption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "customer_phone", length = 50)
    private String customerPhone;

    @Column(name = "work_request_id", nullable = false, length = 50)
    private String workRequestId;

    @Column(name = "discount_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "redeemed_at", nullable = false)
    private LocalDateTime redeemedAt;

    @PrePersist
    protected void onCreate() {
        if (this.redeemedAt == null) this.redeemedAt = LocalDateTime.now();
    }
}
