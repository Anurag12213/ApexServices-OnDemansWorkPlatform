package com.apexservices.security;

import com.apexservices.dto.request.GoogleAuthRequest;
import com.apexservices.dto.response.AuthResponse;
import com.apexservices.model.AuthProvider;
import com.apexservices.model.Role;
import com.apexservices.model.User;
import com.apexservices.repository.UserRepository;
import com.apexservices.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
@DisplayName("Google OAuth2 Security Test Suite - End-to-End Authentication, Role Boundaries & Account Linking")
public class GoogleOAuthSecurityTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoSpyBean
    private AuthService authService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private User existingLocalUser;
    private User existingAdminUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        // 1. Seed standard local customer with password
        existingLocalUser = userRepository.save(User.builder()
                .fullName("Existing Customer")
                .email("existing.customer@example.com")
                .mobileNumber("9876543210")
                .password(passwordEncoder.encode("SecretPass123!"))
                .provider(AuthProvider.LOCAL)
                .role(Role.ROLE_CUSTOMER)
                .active(true)
                .build());

        // 2. Seed verified admin
        existingAdminUser = userRepository.save(User.builder()
                .fullName("Verified Admin")
                .email("verified.admin@apexservices.com")
                .mobileNumber("9998887776")
                .password(passwordEncoder.encode("AdminPass123!"))
                .provider(AuthProvider.LOCAL)
                .role(Role.ROLE_ADMIN)
                .active(true)
                .build());
    }

    private GoogleIdToken.Payload createMockPayload(String email, String name, String sub) {
        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setEmail(email);
        payload.set("name", name);
        payload.setSubject(sub);
        return payload;
    }

    @Test
    @DisplayName("Public Google Login: Rejects attempt to register or claim ROLE_ADMIN via public /api/auth/google")
    void testPublicGoogleLogin_RejectsRoleAdminEscalation() throws Exception {
        GoogleAuthRequest request = GoogleAuthRequest.builder()
                .idToken("mock-valid-id-token")
                .role(Role.ROLE_ADMIN)
                .build();

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Admin Google Login: Rejects non-admin user with HTTP 403 Forbidden")
    void testAdminGoogleLogin_RejectsNonAdminUser() throws Exception {
        GoogleIdToken.Payload customerPayload = createMockPayload("existing.customer@example.com", "Existing Customer", "google-sub-cust-123");
        doReturn(customerPayload).when(authService).verifyGoogleIdToken(anyString());

        GoogleAuthRequest request = GoogleAuthRequest.builder()
                .idToken("mock-customer-id-token")
                .build();

        mockMvc.perform(post("/api/auth/admin/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("Forbidden")));
    }

    @Test
    @DisplayName("Admin Google Login: Rejects unknown Google account with HTTP 403 Forbidden (Never auto-grants ROLE_ADMIN)")
    void testAdminGoogleLogin_RejectsUnknownUser() throws Exception {
        GoogleIdToken.Payload strangerPayload = createMockPayload("unknown.stranger@gmail.com", "Unknown Stranger", "google-sub-stranger-999");
        doReturn(strangerPayload).when(authService).verifyGoogleIdToken(anyString());

        GoogleAuthRequest request = GoogleAuthRequest.builder()
                .idToken("mock-stranger-id-token")
                .build();

        mockMvc.perform(post("/api/auth/admin/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("Forbidden")));
    }

    @Test
    @DisplayName("Admin Google Login: Successfully authenticates existing verified ROLE_ADMIN")
    void testAdminGoogleLogin_SucceedsForVerifiedAdmin() throws Exception {
        GoogleIdToken.Payload adminPayload = createMockPayload("verified.admin@apexservices.com", "Verified Admin", "google-sub-admin-777");
        doReturn(adminPayload).when(authService).verifyGoogleIdToken(anyString());

        GoogleAuthRequest request = GoogleAuthRequest.builder()
                .idToken("mock-admin-id-token")
                .build();

        mockMvc.perform(post("/api/auth/admin/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.role", is("ROLE_ADMIN")));

        User updatedAdmin = userRepository.findByEmail("verified.admin@apexservices.com").orElseThrow();
        assertEquals("google-sub-admin-777", updatedAdmin.getProviderId());
    }

    @Test
    @DisplayName("Account Linking: Links Google Identity without overwriting or destroying local password")
    void testGoogleLogin_LinksAccountWithoutOverwritingPassword() throws Exception {
        GoogleIdToken.Payload customerPayload = createMockPayload("existing.customer@example.com", "Existing Customer", "google-sub-link-101");
        doReturn(customerPayload).when(authService).verifyGoogleIdToken(anyString());

        String originalPasswordHash = existingLocalUser.getPassword();
        assertNotNull(originalPasswordHash);

        GoogleAuthRequest request = GoogleAuthRequest.builder()
                .idToken("mock-customer-id-token")
                .role(Role.ROLE_CUSTOMER)
                .build();

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.email", is("existing.customer@example.com")));

        User linkedUser = userRepository.findByEmail("existing.customer@example.com").orElseThrow();
        assertEquals("google-sub-link-101", linkedUser.getProviderId());
        // Verify local password is preserved and matches original
        assertEquals(originalPasswordHash, linkedUser.getPassword());
        assertTrue(passwordEncoder.matches("SecretPass123!", linkedUser.getPassword()));
    }

    @Test
    @DisplayName("Account Creation: Automatically creates new customer when logging in via Google for first time")
    void testGoogleLogin_AutoRegistersNewCustomer() throws Exception {
        GoogleIdToken.Payload newPayload = createMockPayload("new.customer@gmail.com", "New Google User", "google-sub-new-202");
        doReturn(newPayload).when(authService).verifyGoogleIdToken(anyString());

        GoogleAuthRequest request = GoogleAuthRequest.builder()
                .idToken("mock-new-id-token")
                .role(Role.ROLE_CUSTOMER)
                .build();

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.role", is("ROLE_CUSTOMER")))
                .andExpect(jsonPath("$.user.email", is("new.customer@gmail.com")));

        Optional<User> createdUser = userRepository.findByEmail("new.customer@gmail.com");
        assertTrue(createdUser.isPresent());
        assertEquals(AuthProvider.GOOGLE, createdUser.get().getProvider());
        assertEquals("google-sub-new-202", createdUser.get().getProviderId());
    }

    @Test
    @DisplayName("Security: Blocks login for deactivated accounts attempting Google SSO")
    void testGoogleLogin_BlocksDeactivatedAccount() throws Exception {
        User deactivated = userRepository.save(User.builder()
                .fullName("Deactivated User")
                .email("deactivated@example.com")
                .mobileNumber("9111222333")
                .password(passwordEncoder.encode("AnyPass123!"))
                .provider(AuthProvider.LOCAL)
                .role(Role.ROLE_CUSTOMER)
                .active(false) // Deactivated
                .build());

        GoogleIdToken.Payload deactivatedPayload = createMockPayload("deactivated@example.com", "Deactivated User", "google-sub-deactivated-303");
        doReturn(deactivatedPayload).when(authService).verifyGoogleIdToken(anyString());

        GoogleAuthRequest request = GoogleAuthRequest.builder()
                .idToken("mock-deactivated-id-token")
                .role(Role.ROLE_CUSTOMER)
                .build();

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("deactivated")));
    }

    @Test
    @DisplayName("Public Config: /api/auth/google/client-id returns configured client ID")
    void testPublicGoogleClientIdEndpoint() throws Exception {
        mockMvc.perform(get("/api/auth/google/client-id"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clientId", notNullValue()));
    }

    @Test
    @DisplayName("OAuth2 Redirect: /api/auth/oauth2/authorize/google returns 302 redirecting to accounts.google.com")
    void testOAuth2AuthorizeEndpoint() throws Exception {
        mockMvc.perform(get("/api/auth/oauth2/authorize/google?portal=customer"))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", containsString("accounts.google.com/o/oauth2/v2/auth")));
    }
}
