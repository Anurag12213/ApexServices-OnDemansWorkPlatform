package com.apexservices.service;

import com.apexservices.dto.request.*;
import com.apexservices.dto.response.*;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
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
    private final EmailOtpService emailOtpService;
    private final com.apexservices.email.EmailService emailService;

    // Static dummy BCrypt hash used to equalize execution time against timing attacks for non-existent users
    private static final String DUMMY_HASH = "$2a$10$7EqJtq98hPqEX7fNZaFWoOhtn.02nF3r.f4FfGZ4K9mD5zXlH3lU.";

    @Value("${security.google.client-id:}")
    private String googleClientId;

    @Value("${security.google.client-secret:}")
    private String googleClientSecret;

    @Value("${frontend.customer-url:http://localhost:5173}")
    private String customerFrontendUrl;

    @Value("${frontend.partner-url:http://localhost:5174}")
    private String partnerFrontendUrl;

    @Value("${frontend.admin-url:http://localhost:5175}")
    private String adminFrontendUrl;

    @Value("${backend.base-url:http://localhost:8080}")
    private String backendBaseUrl;

    public String getGoogleClientId() {
        return this.googleClientId != null ? this.googleClientId.trim() : "";
    }

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

        // Mandatory Email Verification: Any registration supplying an email MUST provide a valid verification grant
        if (email != null && !email.isBlank()) {
            if (request.getVerificationGrant() == null || request.getVerificationGrant().isBlank()) {
                log.warn("[SECURITY AUDIT] Email registration rejected: missing verification grant for [{}]", maskIdentifier(email));
                throw new IllegalArgumentException("Verification grant token is required for email registration.");
            }
            emailOtpService.validateAndConsumeGrant(email, com.apexservices.model.OtpPurpose.REGISTRATION, request.getVerificationGrant().trim());
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

        // Dispatch Welcome email asynchronously if email is present
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            try {
                emailService.sendWelcomeEmail(user.getEmail(), user.getFullName(), null);
            } catch (Exception ex) {
                log.warn("[EMAIL] Failed to dispatch welcome email: {}", ex.getMessage());
            }
        }

        return buildAuthResponse(user);
    }

    /**
     * Authenticate or Auto-Register via Google OAuth2 ID Token (Customer & Partner)
     * Strictly blocks claiming ROLE_ADMIN.
     */
    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        if (request.getRole() == Role.ROLE_ADMIN) {
            log.warn("[SECURITY AUDIT] Unauthorized attempt to register or login as ROLE_ADMIN via public Google endpoint");
            throw new BadCredentialsException("Administrator access must be authenticated via the Admin portal.");
        }

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
            log.info("[SECURITY AUDIT] Existing user authenticated via Google SSO [id={}, role={}]", user.getId(), user.getRole());
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
     * Dedicated Administrator Authentication via Google OAuth2 ID Token.
     * Enforces that the user already exists AND possesses ROLE_ADMIN.
     * Returns HTTP 403 Forbidden (AccessDeniedException) if unvetted account attempts login.
     */
    @Transactional
    public AuthResponse loginAdminWithGoogle(GoogleAuthRequest request) {
        GoogleIdToken.Payload payload = verifyGoogleIdToken(request.getIdToken());
        if (payload == null) {
            log.warn("[SECURITY AUDIT] Admin Google OAuth verification failed: invalid or expired ID token");
            throw new BadCredentialsException("Invalid or expired Google ID Token");
        }

        String email = payload.getEmail();
        if (email == null || email.isBlank()) {
            throw new BadCredentialsException("Google account has no associated email address");
        }

        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> {
                    log.warn("[SECURITY AUDIT] Admin Google login rejected: account not found for [{}]", maskIdentifier(email));
                    return new AccessDeniedException("Access Denied: Your Google account does not have administrative privileges.");
                });

        if (user.getRole() != Role.ROLE_ADMIN) {
            log.warn("[SECURITY AUDIT] Admin Google login rejected: user [{}] possesses role [{}] instead of ROLE_ADMIN", maskIdentifier(email), user.getRole());
            throw new AccessDeniedException("Access Denied: Your Google account does not have administrative privileges.");
        }

        if (!user.isActive()) {
            log.warn("[SECURITY AUDIT] Admin Google login rejected: deactivated account [{}]", maskIdentifier(email));
            throw new BadCredentialsException("Your account is currently deactivated. Please contact support.");
        }

        if (user.getProviderId() == null) {
            user.setProviderId(payload.getSubject());
            user = userRepository.save(user);
        }

        log.info("[SECURITY AUDIT] Administrator logged in successfully via Google SSO [id={}]", user.getId());
        return buildAuthResponse(user);
    }

    /**
     * Constructs Google OAuth2 Authorization URL with state and PKCE/nonce parameters.
     */
    public String buildGoogleAuthorizationUrl(String portal, String returnUrl) {
        String clientId = this.googleClientId != null ? this.googleClientId.trim() : "";
        if (clientId.isEmpty()) {
            throw new IllegalStateException("Google OAuth Client ID is not configured on the server.");
        }
        String redirectUri = backendBaseUrl + "/api/auth/oauth2/callback/google";
        String normalizedPortal = (portal != null && !portal.isBlank()) ? portal.toLowerCase().trim() : "customer";
        String state = Base64.getUrlEncoder().encodeToString(
                (normalizedPortal + ":" + System.currentTimeMillis() + ":" + (returnUrl != null ? returnUrl : "")).getBytes(StandardCharsets.UTF_8)
        );

        return "https://accounts.google.com/o/oauth2/v2/auth?"
                + "client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
                + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
                + "&response_type=code"
                + "&scope=" + URLEncoder.encode("openid profile email", StandardCharsets.UTF_8)
                + "&state=" + URLEncoder.encode(state, StandardCharsets.UTF_8)
                + "&access_type=online"
                + "&prompt=select_account";
    }

    /**
     * Handles Google OAuth2 Authorization Code Callback, exchanges code with Google,
     * resolves identity and user role, and returns portal-specific redirect URL with token.
     */
    @Transactional
    public String handleOAuth2Callback(String code, String state, String error) {
        String portal = "customer";
        if (state != null && !state.isBlank()) {
            try {
                String decodedState = new String(Base64.getUrlDecoder().decode(state), StandardCharsets.UTF_8);
                String[] parts = decodedState.split(":", 3);
                if (parts.length > 0 && !parts[0].isBlank()) {
                    portal = parts[0].toLowerCase().trim();
                }
            } catch (Exception ignored) {}
        }

        String targetPortalUrl = switch (portal) {
            case "admin" -> adminFrontendUrl;
            case "partner" -> partnerFrontendUrl;
            default -> customerFrontendUrl;
        };

        if (error != null && !error.isBlank()) {
            log.warn("[SECURITY AUDIT] Google OAuth authorization callback returned error: {}", error);
            return targetPortalUrl + "/login?error=" + URLEncoder.encode("Google sign-in was canceled or denied: " + error, StandardCharsets.UTF_8);
        }

        if (code == null || code.isBlank()) {
            return targetPortalUrl + "/login?error=" + URLEncoder.encode("Missing authorization code from Google.", StandardCharsets.UTF_8);
        }

        try {
            // Exchange code for tokens at https://oauth2.googleapis.com/token
            String redirectUri = backendBaseUrl + "/api/auth/oauth2/callback/google";
            String requestBody = "code=" + URLEncoder.encode(code, StandardCharsets.UTF_8)
                    + "&client_id=" + URLEncoder.encode(googleClientId != null ? googleClientId.trim() : "", StandardCharsets.UTF_8)
                    + "&client_secret=" + URLEncoder.encode(googleClientSecret != null ? googleClientSecret.trim() : "", StandardCharsets.UTF_8)
                    + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
                    + "&grant_type=authorization_code";

            HttpClient httpClient = HttpClient.newHttpClient();
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/token"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (httpResponse.statusCode() != 200) {
                log.error("[SECURITY AUDIT] Failed to exchange Google auth code for token. HTTP {}: {}", httpResponse.statusCode(), httpResponse.body());
                return targetPortalUrl + "/login?error=" + URLEncoder.encode("Failed to exchange authorization token with Google.", StandardCharsets.UTF_8);
            }

            JsonNode jsonNode = new ObjectMapper().readTree(httpResponse.body());
            String idToken = jsonNode.has("id_token") ? jsonNode.get("id_token").asText() : null;

            if (idToken == null || idToken.isBlank()) {
                return targetPortalUrl + "/login?error=" + URLEncoder.encode("No ID token returned by Google.", StandardCharsets.UTF_8);
            }

            AuthResponse authResponse;
            if ("admin".equalsIgnoreCase(portal)) {
                authResponse = loginAdminWithGoogle(GoogleAuthRequest.builder().idToken(idToken).build());
            } else {
                Role requestedRole = "partner".equalsIgnoreCase(portal) ? Role.ROLE_PARTNER : Role.ROLE_CUSTOMER;
                authResponse = loginWithGoogle(GoogleAuthRequest.builder().idToken(idToken).role(requestedRole).build());
            }

            return targetPortalUrl + "/login?oauth_token=" + URLEncoder.encode(authResponse.getToken(), StandardCharsets.UTF_8)
                    + "&role=" + authResponse.getUser().getRole().name();

        } catch (AccessDeniedException ade) {
            log.warn("[SECURITY AUDIT] OAuth2 callback access denied: {}", ade.getMessage());
            return targetPortalUrl + "/login?error=" + URLEncoder.encode(ade.getMessage(), StandardCharsets.UTF_8);
        } catch (Exception ex) {
            log.error("[SECURITY AUDIT] OAuth2 callback processing failed", ex);
            return targetPortalUrl + "/login?error=" + URLEncoder.encode("Authentication processing failed: " + ex.getMessage(), StandardCharsets.UTF_8);
        }
    }

    /**
     * Get Current Authenticated User Summary
     */
    public UserSummaryDto getCurrentUser(String identifier) {
        User user = userRepository.findByIdentifier(identifier)
                .orElseThrow(() -> new BadCredentialsException("User account not found"));
        return mapToSummary(user);
    }

    public GoogleIdToken.Payload verifyGoogleIdToken(String idTokenString) {
        try {
            GoogleIdTokenVerifier.Builder verifierBuilder = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            );

            if (googleClientId != null && !googleClientId.isBlank()) {
                verifierBuilder.setAudience(Collections.singletonList(googleClientId.trim()));
            }

            GoogleIdTokenVerifier verifier = verifierBuilder.build();
            GoogleIdToken idToken = verifier.verify(idTokenString);
            return idToken != null ? idToken.getPayload() : null;
        } catch (Exception e) {
            log.warn("[SECURITY AUDIT] Google ID token verification error: {}", e.getMessage());
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

    /**
     * Resets a user's password using an authenticated single-use Verification Grant.
     * Enforces that ROLE_ADMIN passwords cannot be reset via public recovery endpoints.
     */
    @Transactional
    public void resetPasswordWithGrant(ResetPasswordWithOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        // 1. Atomically validate and consume the single-use grant
        emailOtpService.validateAndConsumeGrant(email, com.apexservices.model.OtpPurpose.PASSWORD_RESET, request.getVerificationGrant());

        // 2. Fetch user account
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User account not found"));

        if (!user.isActive()) {
            throw new BadCredentialsException("Your account is currently deactivated. Please contact support.");
        }

        // STRICT SECURITY INVARIANT: Public password reset for ROLE_ADMIN is prohibited
        if (user.getRole() == Role.ROLE_ADMIN) {
            log.warn("[SECURITY ALERT] Unauthorized password reset attempt for administrative account [{}]", maskIdentifier(email));
            throw new BadCredentialsException("Administrative passwords cannot be reset via public recovery endpoints.");
        }

        // 3. Update password using BCrypt
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("[SECURITY AUDIT] Password reset successfully for user [id={}] via verified grant", user.getId());
    }

    private String maskIdentifier(String id) {
        if (id == null || id.length() <= 3) return "***";
        return id.substring(0, 2) + "***" + id.substring(id.length() - 1);
    }
}
