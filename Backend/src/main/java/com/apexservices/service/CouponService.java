package com.apexservices.service;

import com.apexservices.model.Coupon;
import com.apexservices.model.CouponRedemption;
import com.apexservices.model.User;
import com.apexservices.repository.CouponRedemptionRepository;
import com.apexservices.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    private final CouponRedemptionRepository redemptionRepository;
    private final AuditLogService auditLogService;
    private final UserService userService;

    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    public Optional<Coupon> getCouponByCode(String code) {
        return couponRepository.findByCodeIgnoreCase(code);
    }

    @Transactional
    public Coupon createCoupon(Coupon coupon, String actor) {
        if (couponRepository.existsByCodeIgnoreCase(coupon.getCode())) {
            throw new IllegalArgumentException("Coupon code '" + coupon.getCode() + "' already exists");
        }
        if (coupon.getId() == null || coupon.getId().isBlank()) {
            coupon.setId("CPN-" + (System.currentTimeMillis() % 1000000));
        }
        if (coupon.getStatus() == null) {
            coupon.setStatus("ACTIVE");
        }
        Coupon saved = couponRepository.save(coupon);

        auditLogService.record(
                actor != null ? actor : "ADMIN",
                "ADMIN",
                "COUPON_CREATED",
                "COUPON",
                saved.getId(),
                "Created coupon " + saved.getCode() + " (" + saved.getDiscountType() + " " + saved.getDiscountValue() + ")",
                "127.0.0.1"
        );

        return saved;
    }

    @Transactional
    public Coupon toggleStatus(String id, String actor) {
        Coupon c = couponRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Coupon not found: " + id));

        String nextStatus = "ACTIVE".equalsIgnoreCase(c.getStatus()) ? "PAUSED" : "ACTIVE";
        c.setStatus(nextStatus);
        Coupon saved = couponRepository.save(c);

        auditLogService.record(
                actor != null ? actor : "ADMIN",
                "ADMIN",
                "COUPON_STATUS_CHANGED",
                "COUPON",
                id,
                "Coupon " + c.getCode() + " set to " + nextStatus,
                "127.0.0.1"
        );

        return saved;
    }

    @Transactional
    public void deleteCoupon(String id, String actor) {
        Coupon c = couponRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Coupon not found: " + id));

        couponRepository.delete(c);

        auditLogService.record(
                actor != null ? actor : "ADMIN",
                "ADMIN",
                "COUPON_DELETED",
                "COUPON",
                id,
                "Deleted coupon " + c.getCode(),
                "127.0.0.1"
        );
    }

    /**
     * Authoritative backend validation of coupon discounts for an authenticated or anonymous principal.
     */
    public Map<String, Object> validateCouponForPrincipal(
            String code,
            BigDecimal orderAmount,
            String phone,
            String principalIdentifier,
            String category
    ) {
        Long userId = null;
        String resolvedPhone = phone;
        if (principalIdentifier != null && !principalIdentifier.isBlank()) {
            Optional<User> uOpt = userService.findByIdentifier(principalIdentifier);
            if (uOpt.isPresent()) {
                User u = uOpt.get();
                userId = u.getId();
                if (resolvedPhone == null || resolvedPhone.isBlank()) {
                    resolvedPhone = u.getMobileNumber();
                }
            }
        }
        return validateCoupon(code, orderAmount, resolvedPhone, userId, category);
    }

    /**
     * Authoritative backend validation of coupon discounts.
     */
    public Map<String, Object> validateCoupon(
            String code,
            BigDecimal orderAmount,
            String customerPhone,
            Long userId,
            String category
    ) {
        Map<String, Object> response = new HashMap<>();

        if (code == null || code.isBlank()) {
            response.put("valid", false);
            response.put("message", "Please enter a coupon code");
            return response;
        }

        Optional<Coupon> opt = couponRepository.findByCodeIgnoreCase(code.trim());
        if (opt.isEmpty()) {
            response.put("valid", false);
            response.put("message", "Invalid promo code. Please check and try again.");
            return response;
        }

        Coupon coupon = opt.get();

        if (!"ACTIVE".equalsIgnoreCase(coupon.getStatus())) {
            response.put("valid", false);
            response.put("message", "This promo code is currently inactive.");
            return response;
        }

        LocalDateTime now = LocalDateTime.now();
        if (coupon.getValidUntil() != null && now.isAfter(coupon.getValidUntil())) {
            response.put("valid", false);
            response.put("message", "This promo code has expired.");
            return response;
        }

        if (coupon.getValidFrom() != null && now.isBefore(coupon.getValidFrom())) {
            response.put("valid", false);
            response.put("message", "This promo code is not active yet.");
            return response;
        }

        if (orderAmount != null && coupon.getMinOrderValue() != null && orderAmount.compareTo(coupon.getMinOrderValue()) < 0) {
            response.put("valid", false);
            response.put("message", "Minimum order value of ₹" + coupon.getMinOrderValue().toPlainString() + " required for this coupon.");
            return response;
        }

        if (coupon.getMaxRedemptions() != null && coupon.getTotalRedemptions() >= coupon.getMaxRedemptions()) {
            response.put("valid", false);
            response.put("message", "This promo code has reached its maximum global redemptions.");
            return response;
        }

        // Check user redemption limit
        if (customerPhone != null && !customerPhone.isBlank()) {
            long used = redemptionRepository.countByCouponIdAndCustomerPhone(coupon.getId(), customerPhone.trim());
            if (used >= coupon.getPerUserLimit()) {
                response.put("valid", false);
                response.put("message", "You have already reached the redemption limit for this coupon.");
                return response;
            }
        }

        // Calculate discount
        BigDecimal discount = BigDecimal.ZERO;
        BigDecimal base = orderAmount != null && orderAmount.compareTo(BigDecimal.ZERO) > 0 ? orderAmount : new BigDecimal("499.00");

        if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
            discount = base.multiply(coupon.getDiscountValue()).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            if (coupon.getMaxDiscountCap() != null && discount.compareTo(coupon.getMaxDiscountCap()) > 0) {
                discount = coupon.getMaxDiscountCap();
            }
        } else {
            // FLAT
            discount = coupon.getDiscountValue();
            if (discount.compareTo(base) > 0) {
                discount = base;
            }
        }

        BigDecimal netAmount = base.subtract(discount);
        if (netAmount.compareTo(BigDecimal.ZERO) < 0) {
            netAmount = BigDecimal.ZERO;
        }

        response.put("valid", true);
        response.put("code", coupon.getCode());
        response.put("discountType", coupon.getDiscountType());
        response.put("discountValue", coupon.getDiscountValue());
        response.put("discountAmount", discount);
        response.put("netAmount", netAmount);
        response.put("message", "Coupon " + coupon.getCode() + " applied successfully! Saved ₹" + discount.toPlainString());
        return response;
    }

    @Transactional
    public void recordRedemption(
            String code,
            String workRequestId,
            Long userId,
            String customerPhone,
            BigDecimal discountAmount
    ) {
        Optional<Coupon> opt = couponRepository.findByCodeIgnoreCase(code);
        if (opt.isPresent()) {
            Coupon c = opt.get();
            c.setTotalRedemptions(c.getTotalRedemptions() + 1);
            couponRepository.save(c);

            CouponRedemption redemption = CouponRedemption.builder()
                    .coupon(c)
                    .userId(userId)
                    .customerPhone(customerPhone)
                    .workRequestId(workRequestId)
                    .discountAmount(discountAmount != null ? discountAmount : BigDecimal.ZERO)
                    .redeemedAt(LocalDateTime.now())
                    .build();

            redemptionRepository.save(redemption);
            log.info("Coupon {} redeemed for order {} (saved ₹{})", code, workRequestId, discountAmount);
        }
    }
}
