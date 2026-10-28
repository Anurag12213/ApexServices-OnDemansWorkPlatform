package com.apexservices.security;

import com.apexservices.dto.AuthResponse;
import com.apexservices.dto.LoginRequest;
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

import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
@DisplayName("Automated Security & Validation Test Suite - Authentication Flow & SQLi Defenses")
public class AuthValidationAndSecurityTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthService authService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private User testCustomer;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        // Ensure baseline customer exists for testing
        testCustomer = userRepository.findByEmail("test.user@apexservices.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("Test Customer")
                        .email("test.user@apexservices.com")
                        .mobileNumber("+919876543210")
                        .password(passwordEncoder.encode("SecretPass123"))
                        .role(Role.ROLE_CUSTOMER)
                        .provider(AuthProvider.LOCAL)
                        .active(true)
                        .build())
        );
    }

    // 1. Valid email login
    @Test
    @DisplayName("1. Valid email login must authenticate successfully and return JWT token")
    void testValidEmailLogin() throws Exception {
        LoginRequest req = LoginRequest.builder()
                .identifier("test.user@apexservices.com")
                .password("SecretPass123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("test.user@apexservices.com"))
                .andExpect(jsonPath("$.user.role").value("ROLE_CUSTOMER"));
    }

    // 2. Valid mobile-number login
    @Test
    @DisplayName("2. Valid mobile-number login must authenticate successfully and return JWT token")
    void testValidMobileNumberLogin() throws Exception {
        LoginRequest req = LoginRequest.builder()
                .identifier("+919876543210")
                .password("SecretPass123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.mobileNumber").value("+919876543210"));
    }

    // 3. Missing email / mobile number
    @Test
    @DisplayName("3. Missing identifier must return 400 Bad Request with field error")
    void testMissingIdentifier() throws Exception {
        String payload = "{\"identifier\":\"\",\"password\":\"SecretPass123\"}";

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.identifier").isNotEmpty());
    }

    // 4. Malformed email
    @Test
    @DisplayName("4. Malformed email must return 400 Bad Request without leaking internal details")
    void testMalformedEmail() throws Exception {
        String payload = "{\"identifier\":\"invalid-email-format\",\"password\":\"SecretPass123\"}";

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.identifier").isNotEmpty());
    }

    // 5. Invalid mobile-number format
    @Test
    @DisplayName("5. Invalid mobile number format (e.g. test OR SELECT) must return 400 Bad Request")
    void testInvalidMobileNumberFormat() throws Exception {
        String payload = "{\"identifier\":\"test OR SELECT\",\"password\":\"SecretPass123\"}";

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.identifier").isNotEmpty());
    }

    // 6. Missing password
    @Test
    @DisplayName("6. Missing password must return 400 Bad Request with field error")
    void testMissingPassword() throws Exception {
        String payload = "{\"identifier\":\"test.user@apexservices.com\",\"password\":\"\"}";

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.password").isNotEmpty());
    }

    // 7. Incorrect credentials
    @Test
    @DisplayName("7. Incorrect credentials must return 401 Unauthorized with generic message")
    void testIncorrectCredentials() throws Exception {
        LoginRequest req = LoginRequest.builder()
                .identifier("test.user@apexservices.com")
                .password("WrongPassword999!")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value(containsString("Invalid email/mobile number or password")));
    }

    // 8. Inputs containing quotes, SQL keywords, and comment characters
    @Test
    @DisplayName("8. SQL keywords and metacharacters in login identifier must not alter query or cause 500 error")
    void testSqlInjectionAttemptHandledSafely() throws Exception {
        // Test various SQL injection payloads
        String[] sqliPayloads = {
                "' OR '1'='1",
                "admin'--",
                "test' UNION SELECT 1,2,3--",
                "test OR SELECT"
        };

        for (String payload : sqliPayloads) {
            String json = "{\"identifier\":\"" + payload.replace("\"", "\\\"") + "\",\"password\":\"password123\"}";

            // Since it is an invalid format, it is rejected by validation (400) or rejected by auth (401), NEVER 500
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json))
                    .andExpect(status().is(anyOf(is(400), is(401))))
                    .andExpect(jsonPath("$.status").value(anyOf(is(400), is(401))));
        }
    }

    // 9. Repository queries with parameterized input directly tested
    @Test
    @DisplayName("9. Database layer parameterized query must safely handle malicious input without SQL injection")
    void testRepositoryParameterizedQuerySafety() {
        String maliciousIdentifier = "nonexistent' OR 1=1 --";

        // Must safely return Optional.empty() via prepared statement parameter binding without throwing SQL syntax exceptions
        Optional<User> result = userRepository.findByIdentifier(maliciousIdentifier);
        assertTrue(result.isEmpty(), "Parameterized query must safely return empty for malicious SQL payload");

        String quotePayload = "test' OR 'a'='a";
        Optional<User> quoteResult = userRepository.findByIdentifier(quotePayload);
        assertTrue(quoteResult.isEmpty(), "Parameterized query must treat quote payload as literal search value");
    }

    // 10. Passwords must not be normalized or trimmed silently
    @Test
    @DisplayName("10. Passwords containing leading/trailing spaces must be matched literally, not trimmed")
    void testPasswordNotSilentlyTrimmed() {
        User spaceUser = userRepository.save(User.builder()
                .fullName("Space Password User")
                .email("space.pass@apexservices.com")
                .password(passwordEncoder.encode(" pass with spaces "))
                .role(Role.ROLE_CUSTOMER)
                .provider(AuthProvider.LOCAL)
                .active(true)
                .build());

        // Login with exact password must succeed
        LoginRequest exactReq = LoginRequest.builder()
                .identifier("space.pass@apexservices.com")
                .password(" pass with spaces ")
                .build();
        AuthResponse exactRes = authService.login(exactReq);
        assertNotNull(exactRes);

        // Login with trimmed password must fail
        LoginRequest trimmedReq = LoginRequest.builder()
                .identifier("space.pass@apexservices.com")
                .password("pass with spaces")
                .build();
        assertThrows(BadCredentialsException.class, () -> authService.login(trimmedReq));
    }

    // 11. Authorization regression: Me endpoint requires authentication
    @Test
    @DisplayName("11. Unauthenticated request to /api/auth/me returns 401 Unauthorized")
    void testMeEndpointRequiresAuth() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
