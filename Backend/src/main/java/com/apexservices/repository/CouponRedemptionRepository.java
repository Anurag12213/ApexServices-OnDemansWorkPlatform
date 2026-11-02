package com.apexservices.repository;

import com.apexservices.model.CouponRedemption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CouponRedemptionRepository extends JpaRepository<CouponRedemption, Long> {
    long countByCouponIdAndUserId(String couponId, Long userId);
    long countByCouponIdAndCustomerPhone(String couponId, String customerPhone);
    List<CouponRedemption> findByWorkRequestId(String workRequestId);
}
