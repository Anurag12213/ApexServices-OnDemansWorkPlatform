package com.apexservices.controller;

import com.apexservices.dto.*;
import com.apexservices.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * General Login via Email or Mobile Number + Password
     */
    @PostMapping({"/login", "/customer/login"})
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String clientIp = extractClientIp(httpRequest);
        return ResponseEntity.ok(authService.login(request, clientIp));
    }

    /**
     * Dedicated Administrator Login verification
     */
    @PostMapping("/admin/login")
    public ResponseEntity<AuthResponse> adminLogin(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String clientIp = extractClientIp(httpRequest);
        return ResponseEntity.ok(authService.loginAdmin(request, clientIp));
    }

    /**
     * Register a new user with Email or Mobile Number + Password
     * Restricts role to ROLE_CUSTOMER or ROLE_PARTNER
     */
    @PostMapping({"/register", "/customer/register"})
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    /**
     * Google OAuth2 Login / Auto-Registration via Google ID Token
     */
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(authService.loginWithGoogle(request));
    }

    /**
     * Invalidate and revoke current session token (Server-Side Logout)
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        authService.logout(authHeader);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully. Session token revoked."));
    }

    /**
     * Get details of currently authenticated user from JWT Bearer token
     */
    @GetMapping("/me")
    public ResponseEntity<UserSummaryDto> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            throw new BadCredentialsException("Unauthenticated");
        }
        return ResponseEntity.ok(authService.getCurrentUser(userDetails.getUsername()));
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
