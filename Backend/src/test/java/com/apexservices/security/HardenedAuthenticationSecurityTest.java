package com.apexservices.security;

import com.apexservices.dto.AuthResponse;
import com.apexservices.dto.LoginRequest;
import com.apexservices.dto.RegisterRequest;
import com.apexservices.exception.RateLimitExceededException;
import com.apexservices.model.AuthProvider;
import com.apexservices.model.Role;
import com.apexservices.model.User;
import com.apexservices.repository.UserRepository;
import com.apexservices.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.Date;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
@DisplayName("Comprehensive Hardened Security Test Suite - Authentication, Password, JWT & Rate Limiting")
public class HardenedAuthenticationSecurityTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private TokenBlacklistService tokenBlacklistService;

    @Autowired
    private LoginRateLimiterService rateLimiterService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private User sampleUser;
    private static final String SAMPLE_PASSWORD = "StrongPassword@2026";
    private static final String SAMPLE_EMAIL = "security.audit.user@apexservices.com";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        rateLimiterService.clearAll();
        tokenBlacklistService.clearAll();

        sampleUser = userRepository.findByEmail(SAMPLE_EMAIL).orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("Security Audit Subject")
                        .email(SAMPLE_EMAIL)
                        .mobileNumber("9899001122")
                        .password(passwordEncoder.encode(SAMPLE_PASSWORD))
                        .role(Role.ROLE_CUSTOMER)
                        .provider(AuthProvider.LOCAL)
                        .active(true)
                        .build())
        );
    }

    // =========================================================================
    // 1. PASSWORD SECURITY & HASHING ENFORCEMENTS
    // =========================================================================

    @Test
    @DisplayName("Password Test: Raw passwords are never stored in plain text and are hashed via BCrypt")
    void testPasswordIsHashedWithBcrypt() {
        assertNotNull(sampleUser.getPassword());
        assertNotEquals(SAMPLE_PASSWORD, sampleUser.getPassword());
        assertTrue(sampleUser.getPassword().startsWith("$2a$") || sampleUser.getPassword().startsWith("$2b$"));
        assertTrue(passwordEncoder.matches(SAMPLE_PASSWORD, sampleUser.getPassword()));
        assertFalse(passwordEncoder.matches("WrongPasswordHere", sampleUser.getPassword()));
    }

    @Test
    @DisplayName("Password Test: Entity serialization (@JsonIgnore) never exposes password hash in JSON")
    void testUserEntityNeverSerializesPassword() throws Exception {
        User userToTest = User.builder()
                .id(999L)
                .fullName("Serialization Test")
                .email("test.serial@apexservices.com")
                .password(sampleUser.getPassword())
                .role(Role.ROLE_CUSTOMER)
                .provider(AuthProvider.LOCAL)
                .active(true)
                .build();
        String json = objectMapper.writeValueAsString(userToTest);
        assertFalse(json.contains("password"), "Serialized User JSON must NEVER contain 'password' property");
        assertFalse(json.contains(sampleUser.getPassword()));
    }

    @Test
    @DisplayName("Password Test: Password > 72 characters is strictly rejected to prevent BCrypt truncation")
    void testPasswordLengthUpperBoundEnforced() throws Exception {
        String overlyLongPassword = "A".repeat(73);
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Truncation Test User")
                .email("truncation.test@apexservices.com")
                .password(overlyLongPassword)
                .role(Role.ROLE_CUSTOMER)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Password")));
    }

    // =========================================================================
    // 2. JWT GENERATION, VALIDATION & SERVER-SIDE REVOCATION (LOGOUT)
    // =========================================================================

    @Test
    @DisplayName("JWT Test: Valid token can access protected /api/auth/me")
    void testValidTokenAccessesProtectedEndpoint() throws Exception {
        LoginRequest login = LoginRequest.builder()
                .identifier(SAMPLE_EMAIL)
                .password(SAMPLE_PASSWORD)
                .build();

        AuthResponse auth = authService.login(login);
        assertNotNull(auth.getToken());

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + auth.getToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(SAMPLE_EMAIL))
                .andExpect(jsonPath("$.role").value("ROLE_CUSTOMER"));
    }

    @Test
    @DisplayName("JWT Test: Tampered or invalid signature token is rejected (401)")
    void testTamperedTokenIsRejected() throws Exception {
        LoginRequest login = LoginRequest.builder()
                .identifier(SAMPLE_EMAIL)
                .password(SAMPLE_PASSWORD)
                .build();
        AuthResponse auth = authService.login(login);

        // Tamper signature
        String tamperedToken = auth.getToken() + "corruptedSignature";

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + tamperedToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("JWT Test: Server-side logout revokes token immediately from further use")
    void testServerSideTokenRevocationOnLogout() throws Exception {
        LoginRequest login = LoginRequest.builder()
                .identifier(SAMPLE_EMAIL)
                .password(SAMPLE_PASSWORD)
                .build();
        AuthResponse auth = authService.login(login);
        String token = auth.getToken();

        // 1. Verify token works prior to logout
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // 2. Call server-side logout
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(containsString("Logged out successfully")));

        // 3. Verify token is now revoked and rejected with 401 Unauthorized
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 3. LOGIN BRUTE-FORCE RATE LIMITING & ACCOUNT ENUMERATION PROTECTION
    // =========================================================================

    @Test
    @DisplayName("Rate Limit Test: 5 consecutive failed login attempts trigger HTTP 429 Too Many Requests")
    void testLoginRateLimitingTriggeredAfterFiveFailures() throws Exception {
        String targetIdentifier = "target.user@apexservices.com";
        String testIp = "192.168.1.55";

        LoginRequest badReq = LoginRequest.builder()
                .identifier(targetIdentifier)
                .password("WrongGuessPass")
                .build();

        // Attempts 1 to 5: Return 401 Bad Credentials
        for (int i = 1; i <= 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .header("X-Forwarded-For", testIp)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(badReq)))
                    .andExpect(status().isUnauthorized());
        }

        // Attempt 6: Must be throttled with HTTP 429 Too Many Requests
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", testIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badReq)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.error").value("Too Many Requests"));
    }

    @Test
    @DisplayName("Anti-Enumeration Test: Unknown identifier returns same generic 401 error message as wrong password")
    void testUnknownIdentifierReturnsGenericError() throws Exception {
        LoginRequest unknownUserReq = LoginRequest.builder()
                .identifier("nonexistent.random@apexservices.com")
                .password("SomePassword123")
                .build();

        LoginRequest wrongPasswordReq = LoginRequest.builder()
                .identifier(SAMPLE_EMAIL)
                .password("WrongPassword123")
                .build();

        var resUnknown = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unknownUserReq)))
                .andExpect(status().isUnauthorized())
                .andReturn();

        var resWrongPass = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongPasswordReq)))
                .andExpect(status().isUnauthorized())
                .andReturn();

        var nodeUnknown = objectMapper.readTree(resUnknown.getResponse().getContentAsString());
        var nodeWrongPass = objectMapper.readTree(resWrongPass.getResponse().getContentAsString());

        assertEquals(nodeUnknown.get("status").asInt(), nodeWrongPass.get("status").asInt());
        assertEquals(nodeUnknown.get("error").asText(), nodeWrongPass.get("error").asText());
        assertEquals(nodeUnknown.get("message").asText(), nodeWrongPass.get("message").asText(),
                "Error messages must be identical to defeat account enumeration");
    }
}
