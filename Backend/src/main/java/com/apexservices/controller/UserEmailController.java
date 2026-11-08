package com.apexservices.controller;

import com.apexservices.dto.response.OtpApiResponse;
import com.apexservices.dto.request.SendEmailOtpRequest;
import com.apexservices.dto.request.VerifyEmailOtpRequest;
import com.apexservices.model.OtpPurpose;
import com.apexservices.service.EmailOtpService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Protected Controller for Authenticated User Email Changes.
 * Strictly requires an active, authenticated JWT session.
 * Cannot be accessed anonymously from public endpoints.
 */
@RestController
@RequestMapping("/api/user/email")
@RequiredArgsConstructor
@Slf4j
public class UserEmailController {

    private final EmailOtpService emailOtpService;

    /**
     * Dispatch an OTP to the user's requested NEW email address.
     * Strictly bound to the caller's authenticated identity.
     */
    @PostMapping("/send-change-otp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OtpApiResponse> sendEmailChangeOtp(
            @Valid @RequestBody SendEmailOtpRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest
    ) {
        if (userDetails == null) {
            throw new BadCredentialsException("Authentication required to request email update.");
        }

        // Enforce purpose restriction: strictly EMAIL_CHANGE
        request.setPurpose(OtpPurpose.EMAIL_CHANGE);

        String clientIp = extractClientIp(httpRequest);
        return ResponseEntity.ok(emailOtpService.sendEmailOtp(request, clientIp));
    }

    /**
     * Atomically finalize the email change using the verified grant.
     */
    @PostMapping("/confirm-change")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> confirmEmailChange(
            @Valid @RequestBody VerifyEmailOtpRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new BadCredentialsException("Authentication required to finalize email update.");
        }

        emailOtpService.confirmEmailChange(userDetails.getUsername(), request);
        return ResponseEntity.ok(Map.of("message", "Email address updated successfully."));
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
