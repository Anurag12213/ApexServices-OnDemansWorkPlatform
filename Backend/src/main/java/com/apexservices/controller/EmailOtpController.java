package com.apexservices.controller;

import com.apexservices.dto.response.OtpApiResponse;
import com.apexservices.dto.request.ResendEmailOtpRequest;
import com.apexservices.dto.request.SendEmailOtpRequest;
import com.apexservices.dto.request.VerifyEmailOtpRequest;
import com.apexservices.service.EmailOtpService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public REST Controller for Centralized Email OTP Challenges.
 * Handled under /api/auth/** to integrate seamlessly with existing stateless security filters.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class EmailOtpController {

    private final EmailOtpService emailOtpService;

    /**
     * Dispatch an OTP challenge to the designated email address.
     */
    @PostMapping("/send-email-otp")
    public ResponseEntity<OtpApiResponse> sendEmailOtp(
            @Valid @RequestBody SendEmailOtpRequest request,
            HttpServletRequest httpRequest
    ) {
        String clientIp = extractClientIp(httpRequest);
        return ResponseEntity.ok(emailOtpService.sendEmailOtp(request, clientIp));
    }

    /**
     * Re-dispatch a fresh OTP challenge adhering to the 60-second cooldown window.
     */
    @PostMapping("/resend-email-otp")
    public ResponseEntity<OtpApiResponse> resendEmailOtp(
            @Valid @RequestBody ResendEmailOtpRequest request,
            HttpServletRequest httpRequest
    ) {
        String clientIp = extractClientIp(httpRequest);
        return ResponseEntity.ok(emailOtpService.resendEmailOtp(request, clientIp));
    }

    /**
     * Verify the 6-digit OTP and generate a single-use verification grant token.
     */
    @PostMapping("/verify-email-otp")
    public ResponseEntity<OtpApiResponse> verifyEmailOtp(
            @Valid @RequestBody VerifyEmailOtpRequest request
    ) {
        return ResponseEntity.ok(emailOtpService.verifyEmailOtp(request));
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "unknown";
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
