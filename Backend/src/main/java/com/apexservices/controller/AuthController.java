package com.apexservices.controller;

import com.apexservices.dto.request.*;
import com.apexservices.dto.response.*;
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
import org.springframework.web.servlet.view.RedirectView;

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
     * Finalize Password Reset with Verified Grant
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordWithOtpRequest request) {
        authService.resetPasswordWithGrant(request);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully. Please log in with your new credentials."));
    }

    /**
     * Retrieve public Google Client ID for frontend GIS synchronization
     */
    @GetMapping("/google/client-id")
    public ResponseEntity<Map<String, String>> getGoogleClientId() {
        return ResponseEntity.ok(Map.of("clientId", authService.getGoogleClientId()));
    }

    /**
     * Google OAuth2 Login / Auto-Registration via Google ID Token (Customer & Partner)
     */
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(authService.loginWithGoogle(request));
    }

    /**
     * Dedicated Administrator Login via Google OAuth2 ID Token
     */
    @PostMapping("/admin/google")
    public ResponseEntity<AuthResponse> adminGoogleLogin(@Valid @RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(authService.loginAdminWithGoogle(request));
    }

    /**
     * Redirect browser to Google OAuth 2.0 Authorization Endpoint
     */
    @GetMapping("/oauth2/authorize/google")
    public RedirectView authorizeGoogle(
            @RequestParam(value = "portal", required = false, defaultValue = "customer") String portal,
            @RequestParam(value = "return_url", required = false) String returnUrl
    ) {
        String authUrl = authService.buildGoogleAuthorizationUrl(portal, returnUrl);
        return new RedirectView(authUrl);
    }

    /**
     * Google OAuth 2.0 Callback: validates code, authenticates user, and redirects to frontend
     */
    @GetMapping("/oauth2/callback/google")
    public RedirectView oauth2CallbackGoogle(
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "error", required = false) String error
    ) {
        String redirectUrl = authService.handleOAuth2Callback(code, state, error);
        return new RedirectView(redirectUrl);
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
