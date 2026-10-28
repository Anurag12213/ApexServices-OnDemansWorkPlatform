package com.apexservices.service;

import com.apexservices.dto.*;
import com.apexservices.model.AuthProvider;
import com.apexservices.model.Role;
import com.apexservices.model.User;
import com.apexservices.repository.UserRepository;
import com.apexservices.security.CustomUserDetails;
import com.apexservices.security.JwtService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final com.apexservices.security.LoginRateLimiterService rateLimiterService;

    // Static dummy BCrypt hash used to equalize execution time against timing attacks for non-existent users
    private static final String DUMMY_HASH = "$2a$10$7EqJtq98hPqEX7fNZaFWoOhtn.02nF3r.f4FfGZ4K9mD5zXlH3lU.";

    @Value("${security.google.client-id:}")
    private String googleClientId;

    /**
     * Authenticate via Email OR Mobile Number + Password.
     * Uses uniform generic error message and timing mitigation to prevent account enumeration.
     */
    public AuthResponse login(LoginRequest request) {
        return login(request, null);
    }

    public AuthResponse login(LoginRequest request, String clientIp) {
        String identifier = request.getIdentifier() != null ? request.getIdentifier().trim() : "";
        rateLimiterService.checkRateLimit(clientIp, identifier);

        java.util.Optional<User> userOpt = userRepository.findByIdentifier(identifier);
        if (userOpt.isEmpty()) {
            // Anti-timing mitigation: execute BCrypt against dummy hash to prevent user enumeration
            passwordEncoder.matches(request.getPassword() != null ? request.getPassword() : "", DUMMY_HASH);
            rateLimiterService.recordFailedAttempt(clientIp, identifier);
            log.warn("[SECURITY AUDIT] Failed login attempt: unknown identifier [{}]", maskIdentifier(identifier));
            throw new BadCredentialsException("Invalid email/mobile number or password.");
        }

        User user = userOpt.get();

        if (!user.isActive()) {
            rateLimiterService.recordFailedAttempt(clientIp, identifier);
            log.warn("[SECURITY AUDIT] Login blocked: deactivated user account [{}]", maskIdentifier(identifier));
            throw new BadCredentialsException("Your account is currently deactivated. Please contact support.");
        }

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            rateLimiterService.recordFailedAttempt(clientIp, identifier);
            log.warn("[SECURITY AUDIT] Failed login attempt: invalid password for identifier [{}]", maskIdentifier(identifier));
            throw new BadCredentialsException("Invalid email/mobile number or password.");
        }

        rateLimiterService.resetOnSuccess(clientIp, identifier);
        log.info("[SECURITY AUDIT] Successful login for user [id={}, role={}]", user.getId(), user.getRole());
        return buildAuthResponse(user);
    }

    /**
     * Dedicated Administrator Login Verification
     */
    public AuthResponse loginAdmin(LoginRequest request) {
        return loginAdmin(request, null);
    }

    public AuthResponse loginAdmin(LoginRequest request, String clientIp) {
        AuthResponse response = login(request, clientIp);
        if (response.getUser().getRole() != Role.ROLE_ADMIN) {
            log.warn("[SECURITY AUDIT] Admin login rejected: user [id={}] does not possess ROLE_ADMIN", response.getUser().getId());
            throw new BadCredentialsException("Access Denied: Administrative privileges required.");
        }
        return response;
    }

    /**
     * Invalidate active session and blacklist JWT token on logout.
     */
    public void logout(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            jwtService.revokeToken(token);
            log.info("[SECURITY AUDIT] User session token invalidated and revoked via logout endpoint");
        }
    }

    /**
     * Register a new user with Email or Mobile Number + Password.
     * Enforces security policy: prevents assigning ROLE_ADMIN from public registration.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;
        String mobile = request.getMobileNumber() != null ? request.getMobileNumber().trim() : null;

        if ((email == null || email.isBlank()) && (mobile == null || mobile.isBlank())) {
            throw new IllegalArgumentException("Either email or mobile number must be provided.");
        }

        // Strict Security Constraint: Forbid public registration from claiming ROLE_ADMIN
        if (request.getRole() == Role.ROLE_ADMIN) {
            log.warn("[SECURITY AUDIT] Unauthorized attempt to register as ROLE_ADMIN by [{}]", email != null ? email : mobile);
            throw new IllegalArgumentException("Administrator registration is not permitted via public registration endpoint.");
        }

        if (email != null && !email.isBlank() && userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already registered: " + email);
        }

        if (mobile != null && !mobile.isBlank() && userRepository.existsByMobileNumber(mobile)) {
            throw new IllegalArgumentException("Mobile number is already registered: " + mobile);
        }

        if (!com.apexservices.security.InputSanitizer.isSqlSafe(request.getFullName()) ||
            (email != null && !com.apexservices.security.InputSanitizer.isSqlSafe(email)) ||
            (mobile != null && !com.apexservices.security.InputSanitizer.isSqlSafe(mobile))) {
            log.warn("[SECURITY AUDIT] Blocked potential SQL injection in registration request");
            throw new IllegalArgumentException("Registration data contains forbidden SQL commands or symbols.");
        }

        // Allowed public roles: ROLE_CUSTOMER (default) or ROLE_PARTNER
        Role assignedRole = (request.getRole() == Role.ROLE_PARTNER) ? Role.ROLE_PARTNER : Role.ROLE_CUSTOMER;

        User user = User.builder()
                .fullName(com.apexservices.security.InputSanitizer.sanitize(request.getFullName()))
                .email(email != null && !email.isBlank() ? email : null)
                .mobileNumber(mobile != null && !mobile.isBlank() ? mobile : null)
                .password(passwordEncoder.encode(request.getPassword()))
                .provider(AuthProvider.LOCAL)
                .role(assignedRole)
                .active(true)
                .build();

        user = userRepository.save(user);
        log.info("[SECURITY AUDIT] New user registered successfully [id={}, role={}]", user.getId(), user.getRole());
        return buildAuthResponse(user);
    }

    /**
     * Authenticate or Auto-Register via Google OAuth2 ID Token
     */
    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        GoogleIdToken.Payload payload = verifyGoogleIdToken(request.getIdToken());
        if (payload == null) {
            log.warn("[SECURITY AUDIT] Google OAuth verification failed: invalid or expired ID token");
            throw new BadCredentialsException("Invalid or expired Google ID Token");
        }

        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String googleSubId = payload.getSubject();

        if (email == null || email.isBlank()) {
            throw new BadCredentialsException("Google account has no associated email address");
        }

        Optional<User> existingUser = userRepository.findByEmail(email.toLowerCase());
        User user;

        if (existingUser.isPresent()) {
            user = existingUser.get();
            if (!user.isActive()) {
                throw new BadCredentialsException("Your account is currently deactivated. Please contact support.");
            }
            if (user.getProviderId() == null) {
                user.setProviderId(googleSubId);
                user = userRepository.save(user);
            }
        } else {
            // Auto-register new Google user (Never assign ROLE_ADMIN via Google public login)
            Role role = (request.getRole() == Role.ROLE_PARTNER) ? Role.ROLE_PARTNER : Role.ROLE_CUSTOMER;
            user = User.builder()
                    .fullName(name != null && !name.isBlank() ? name : "Google User")
                    .email(email.toLowerCase())
                    .provider(AuthProvider.GOOGLE)
                    .providerId(googleSubId)
                    .role(role)
                    .active(true)
                    .build();

            user = userRepository.save(user);
            log.info("[SECURITY AUDIT] New Google OAuth user created [id={}, role={}]", user.getId(), user.getRole());
        }

        return buildAuthResponse(user);
    }

    /**
     * Get Current Authenticated User Summary
     */
    public UserSummaryDto getCurrentUser(String identifier) {
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new BadCredentialsException("User account not found"));
        return mapToSummary(user);
    }

    private GoogleIdToken.Payload verifyGoogleIdToken(String idTokenString) {
        try {
            GoogleIdTokenVerifier.Builder verifierBuilder = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            );

            if (googleClientId != null && !googleClientId.isBlank()) {
                verifierBuilder.setAudience(Collections.singletonList(googleClientId));
            }

            GoogleIdTokenVerifier verifier = verifierBuilder.build();
            GoogleIdToken idToken = verifier.verify(idTokenString);
            return idToken != null ? idToken.getPayload() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private AuthResponse buildAuthResponse(User user) {
        CustomUserDetails userDetails = new CustomUserDetails(user);
        String token = jwtService.generateToken(userDetails, user.getId(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresInMs(jwtService.getExpirationMs())
                .user(mapToSummary(user))
                .build();
    }

    private UserSummaryDto mapToSummary(User user) {
        java.util.List<String> categories = java.util.Collections.emptyList();
        if (user.getRole() == Role.ROLE_PARTNER) {
            try {
                categories = userRepository.findCategoryNamesByPartnerId(user.getId());
            } catch (Exception ignored) {}
        }

        String orgName = null;
        if (user.getOrganization() != null) {
            orgName = user.getOrganization().getName();
        }

        return UserSummaryDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .mobileNumber(user.getMobileNumber())
                .role(user.getRole())
                .provider(user.getProvider())
                .partnerType(user.getPartnerType())
                .organizationName(orgName)
                .serviceCategories(categories)
                .build();
    }

    private String maskIdentifier(String id) {
        if (id == null || id.length() <= 3) return "***";
        return id.substring(0, 2) + "***" + id.substring(id.length() - 1);
    }
}
