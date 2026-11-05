package com.apexservices.controller;

import com.apexservices.service.CouponService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://apexservices-admin-portal.netlify.app", "https://apexservicesondemand.netlify.app", "https://apexservices-partner-portal.netlify.app"})
public class CouponClientController {

    private final CouponService couponService;

    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateCoupon(
            @RequestBody Map<String, Object> req,
            Principal principal
    ) {
        String code = (String) req.get("code");
        Object amountObj = req.get("orderAmount");
        BigDecimal orderAmount = BigDecimal.ZERO;
        if (amountObj instanceof Number num) {
            orderAmount = BigDecimal.valueOf(num.doubleValue());
        } else if (amountObj instanceof String str && !str.isBlank()) {
            try {
                orderAmount = new BigDecimal(str);
            } catch (Exception ignored) {}
        }

        String phone = (String) req.get("phone");
        String category = (String) req.get("category");
        String principalName = principal != null ? principal.getName() : null;

        Map<String, Object> validation = couponService.validateCouponForPrincipal(code, orderAmount, phone, principalName, category);
        return ResponseEntity.ok(validation);
    }
}
