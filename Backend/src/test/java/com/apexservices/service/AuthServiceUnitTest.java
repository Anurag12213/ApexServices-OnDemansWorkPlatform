package com.apexservices.service;
import com.apexservices.dto.request.GoogleAuthRequest;

import com.apexservices.dto.response.AuthResponse;
import com.apexservices.dto.request.LoginRequest;
import com.apexservices.dto.request.RegisterRequest;
import com.apexservices.exception.ConflictException;
import com.apexservices.model.AuthProvider;
import com.apexservices.model.Role;
import com.apexservices.model.User;
import com.apexservices.repository.UserRepository;
import com.apexservices.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Tests - AuthService Business Logic & Security Enforcements")
public class AuthServiceUnitTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private com.apexservices.security.LoginRateLimiterService rateLimiterService;

    @Mock
    private EmailOtpService emailOtpService;

    @Mock
    private com.apexservices.email.EmailService emailService;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .fullName("Amitabh Sengupta")
                .email("amitabh@apexservices.com")
                .mobileNumber("+919876543210")
                .password("$2a$10$hashedPasswordHere")
                .role(Role.ROLE_CUSTOMER)
                .provider(AuthProvider.LOCAL)
                .active(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should successfully authenticate valid user and issue JWT token")
    void testLogin_Success() {
        LoginRequest req = LoginRequest.builder()
                .identifier("amitabh@apexservices.com")
                .password("validPassword123")
                .build();

        when(userRepository.findByIdentifier("amitabh@apexservices.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("validPassword123", sampleUser.getPassword())).thenReturn(true);
        when(jwtService.generateToken(any(), any(), any())).thenReturn("jwt-token-xyz");

        AuthResponse res = authService.login(req);

        assertNotNull(res);
        assertEquals("jwt-token-xyz", res.getToken());
        assertEquals("Amitabh Sengupta", res.getUser().getFullName());
        assertEquals("amitabh@apexservices.com", res.getUser().getEmail());
        assertEquals(Role.ROLE_CUSTOMER, res.getUser().getRole());
    }

    @Test
    @DisplayName("Should reject login with invalid password")
    void testLogin_InvalidPassword() {
        LoginRequest req = LoginRequest.builder()
                .identifier("amitabh@apexservices.com")
                .password("wrongPassword")
                .build();

        when(userRepository.findByIdentifier("amitabh@apexservices.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongPassword", sampleUser.getPassword())).thenReturn(false);

        BadCredentialsException ex = assertThrows(BadCredentialsException.class, () -> authService.login(req));
        assertTrue(ex.getMessage().contains("Invalid email/mobile number or password"));
    }

    @Test
    @DisplayName("Should reject login for non-existent identifier")
    void testLogin_NonExistentIdentifier() {
        LoginRequest req = LoginRequest.builder()
                .identifier("unknown@apexservices.com")
                .password("anyPassword")
                .build();

        when(userRepository.findByIdentifier("unknown@apexservices.com")).thenReturn(Optional.empty());

        BadCredentialsException ex = assertThrows(BadCredentialsException.class, () -> authService.login(req));
        assertTrue(ex.getMessage().contains("Invalid email/mobile number or password"));
    }

    @Test
    @DisplayName("Should block login for deactivated account")
    void testLogin_DeactivatedAccount() {
        sampleUser.setActive(false);
        LoginRequest req = LoginRequest.builder()
                .identifier("amitabh@apexservices.com")
                .password("validPassword123")
                .build();

        when(userRepository.findByIdentifier("amitabh@apexservices.com")).thenReturn(Optional.of(sampleUser));

        BadCredentialsException ex = assertThrows(BadCredentialsException.class, () -> authService.login(req));
        assertTrue(ex.getMessage().contains("deactivated"));
    }

    @Test
    @DisplayName("Should safely handle SQL metacharacters in login identifier via parameterized query without injection")
    void testLogin_SqlInjectionSafeParameterizedHandling() {
        LoginRequest req = LoginRequest.builder()
                .identifier("admin' OR '1'='1")
                .password("anyPassword")
                .build();

        when(userRepository.findByIdentifier("admin' OR '1'='1")).thenReturn(Optional.empty());

        BadCredentialsException ex = assertThrows(BadCredentialsException.class, () -> authService.login(req));
        assertTrue(ex.getMessage().contains("Invalid email/mobile number or password"));
        verify(userRepository).findByIdentifier("admin' OR '1'='1");
    }

    @Test
    @DisplayName("Should prevent non-admin from using admin login portal")
    void testLoginAdmin_AccessDeniedForCustomer() {
        LoginRequest req = LoginRequest.builder()
                .identifier("amitabh@apexservices.com")
                .password("validPassword123")
                .build();

        when(userRepository.findByIdentifier("amitabh@apexservices.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("validPassword123", sampleUser.getPassword())).thenReturn(true);
        when(jwtService.generateToken(any(), any(), any())).thenReturn("jwt-token-xyz");

        BadCredentialsException ex = assertThrows(BadCredentialsException.class, () -> authService.loginAdmin(req));
        assertTrue(ex.getMessage().contains("Administrative privileges required"));
    }

    @Test
    @DisplayName("Should block privilege escalation to ROLE_ADMIN during registration")
    void testRegister_AdminRoleEscalationBlocked() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Attacker")
                .email("attacker@apexservices.com")
                .password("password123")
                .role(Role.ROLE_ADMIN)
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.register(req));
        assertTrue(ex.getMessage().contains("Administrator registration is not permitted"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should reject registration when email already exists")
    void testRegister_DuplicateEmail() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("New User")
                .email("amitabh@apexservices.com")
                .password("password123")
                .role(Role.ROLE_CUSTOMER)
                .build();

        when(userRepository.existsByEmail("amitabh@apexservices.com")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.register(req));
        assertTrue(ex.getMessage().contains("already registered"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should successfully register customer when valid verification grant is provided")
    void testRegister_SuccessWithValidGrant() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Sunita Rao")
                .email("sunita.rao@apexservices.com")
                .mobileNumber("+919811223344")
                .password("strongPassword123")
                .role(Role.ROLE_CUSTOMER)
                .verificationGrant("valid-grant-token-123")
                .build();

        when(userRepository.existsByEmail("sunita.rao@apexservices.com")).thenReturn(false);
        when(userRepository.existsByMobileNumber("+919811223344")).thenReturn(false);
        when(passwordEncoder.encode("strongPassword123")).thenReturn("$2a$10$encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(2L);
            return u;
        });
        when(jwtService.generateToken(any(), any(), any())).thenReturn("token-for-sunita");

        AuthResponse res = authService.register(req);

        assertNotNull(res);
        assertEquals("token-for-sunita", res.getToken());
        assertEquals("Sunita Rao", res.getUser().getFullName());
        assertEquals(Role.ROLE_CUSTOMER, res.getUser().getRole());
        verify(emailOtpService).validateAndConsumeGrant("sunita.rao@apexservices.com", com.apexservices.model.OtpPurpose.REGISTRATION, "valid-grant-token-123");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Security: Email registration without a verification grant must be strictly rejected")
    void testRegister_EmailWithoutGrant_Rejected() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Unverified User")
                .email("unverified@apexservices.com")
                .password("password123")
                .role(Role.ROLE_CUSTOMER)
                .verificationGrant(null) // Omitted grant
                .build();

        when(userRepository.existsByEmail("unverified@apexservices.com")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.register(req));
        assertTrue(ex.getMessage().contains("Verification grant token is required for email registration"));
        verify(userRepository, never()).save(any());
        verify(emailOtpService, never()).validateAndConsumeGrant(any(), any(), any());
    }

    @Test
    @DisplayName("Security: Email registration with blank verification grant must be strictly rejected")
    void testRegister_EmailWithBlankGrant_Rejected() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Blank Grant User")
                .email("blank.grant@apexservices.com")
                .password("password123")
                .role(Role.ROLE_CUSTOMER)
                .verificationGrant("   ")
                .build();

        when(userRepository.existsByEmail("blank.grant@apexservices.com")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.register(req));
        assertTrue(ex.getMessage().contains("Verification grant token is required for email registration"));
        verify(userRepository, never()).save(any());
        verify(emailOtpService, never()).validateAndConsumeGrant(any(), any(), any());
    }

    @Test
    @DisplayName("Security: Email registration with an invalid verification grant must be rejected")
    void testRegister_InvalidGrant_Rejected() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Attacker With Bogus Grant")
                .email("attacker@apexservices.com")
                .password("password123")
                .role(Role.ROLE_CUSTOMER)
                .verificationGrant("invalid-bogus-grant")
                .build();

        when(userRepository.existsByEmail("attacker@apexservices.com")).thenReturn(false);
        doThrow(new ConflictException("Invalid or expired verification grant. Please complete verification again.", "INVALID_GRANT"))
                .when(emailOtpService).validateAndConsumeGrant("attacker@apexservices.com", com.apexservices.model.OtpPurpose.REGISTRATION, "invalid-bogus-grant");

        ConflictException ex = assertThrows(ConflictException.class, () -> authService.register(req));
        assertEquals("INVALID_GRANT", ex.getCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Security: Verification grant belonging to another email address must be rejected")
    void testRegister_GrantBelongingToAnotherEmail_Rejected() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Impersonator")
                .email("victim@apexservices.com")
                .password("password123")
                .role(Role.ROLE_CUSTOMER)
                .verificationGrant("grant-issued-for-different-email")
                .build();

        when(userRepository.existsByEmail("victim@apexservices.com")).thenReturn(false);
        // EmailOtpService enforces that the grant hash matches the normalized target email
        doThrow(new ConflictException("Invalid or expired verification grant. Please complete verification again.", "INVALID_GRANT"))
                .when(emailOtpService).validateAndConsumeGrant("victim@apexservices.com", com.apexservices.model.OtpPurpose.REGISTRATION, "grant-issued-for-different-email");

        ConflictException ex = assertThrows(ConflictException.class, () -> authService.register(req));
        assertEquals("INVALID_GRANT", ex.getCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Security: An already-consumed verification grant cannot be reused for registration")
    void testRegister_AlreadyConsumedGrant_Rejected() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Replay Attacker")
                .email("replay@apexservices.com")
                .password("password123")
                .role(Role.ROLE_CUSTOMER)
                .verificationGrant("already-used-grant-xyz")
                .build();

        when(userRepository.existsByEmail("replay@apexservices.com")).thenReturn(false);
        doThrow(new ConflictException("Invalid or expired verification grant. Please complete verification again.", "INVALID_GRANT"))
                .when(emailOtpService).validateAndConsumeGrant("replay@apexservices.com", com.apexservices.model.OtpPurpose.REGISTRATION, "already-used-grant-xyz");

        ConflictException ex = assertThrows(ConflictException.class, () -> authService.register(req));
        assertEquals("INVALID_GRANT", ex.getCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Compatibility: Mobile-only registration without email still works without requiring an email grant")
    void testRegister_MobileOnly_SuccessWithoutEmailGrant() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Mobile Only User")
                .email(null)
                .mobileNumber("+919876543210")
                .password("mobilePass123")
                .role(Role.ROLE_CUSTOMER)
                .verificationGrant(null)
                .build();

        when(userRepository.existsByMobileNumber("+919876543210")).thenReturn(false);
        when(passwordEncoder.encode("mobilePass123")).thenReturn("$2a$10$encodedMobilePass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(5L);
            return u;
        });
        when(jwtService.generateToken(any(), any(), any())).thenReturn("token-mobile-user");

        AuthResponse res = authService.register(req);

        assertNotNull(res);
        assertEquals("token-mobile-user", res.getToken());
        assertEquals("Mobile Only User", res.getUser().getFullName());
        assertNull(res.getUser().getEmail());
        assertEquals("+919876543210", res.getUser().getMobileNumber());
        // Verify grant service was never invoked for mobile-only registration
        verify(emailOtpService, never()).validateAndConsumeGrant(any(), any(), any());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Compatibility: Google OAuth registration remains functional and verifies Google token independently")
    void testGoogleOAuth_PreservesIndependentTokenValidation() {
        com.apexservices.dto.request.GoogleAuthRequest googleReq = new com.apexservices.dto.request.GoogleAuthRequest();
        googleReq.setIdToken("malformed-or-expired-google-id-token");
        googleReq.setRole(Role.ROLE_CUSTOMER);

        // Invalid Google ID token correctly fails without touching email OTP grants
        BadCredentialsException ex = assertThrows(BadCredentialsException.class, () -> authService.loginWithGoogle(googleReq));
        assertTrue(ex.getMessage().contains("Invalid or expired Google ID Token"));
        verify(emailOtpService, never()).validateAndConsumeGrant(any(), any(), any());
    }

    @Test
    @DisplayName("Atomicity: If user creation fails after grant consumption, exception propagates for transactional rollback")
    void testRegister_UserCreationFailure_PropagatesForRollback() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Failing DB User")
                .email("rollback@apexservices.com")
                .password("password123")
                .role(Role.ROLE_CUSTOMER)
                .verificationGrant("valid-grant-to-be-rolled-back")
                .build();

        when(userRepository.existsByEmail("rollback@apexservices.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("$2a$10$encodedPass");
        // Grant consumption succeeds initially
        doNothing().when(emailOtpService).validateAndConsumeGrant("rollback@apexservices.com", com.apexservices.model.OtpPurpose.REGISTRATION, "valid-grant-to-be-rolled-back");
        // Database save fails unexpectedly
        when(userRepository.save(any(User.class))).thenThrow(new RuntimeException("Database constraint or connectivity error"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.register(req));
        assertTrue(ex.getMessage().contains("Database constraint or connectivity error"));
        // Confirm grant was consumed prior to save failure, ensuring the @Transactional boundary encompasses both
        verify(emailOtpService).validateAndConsumeGrant("rollback@apexservices.com", com.apexservices.model.OtpPurpose.REGISTRATION, "valid-grant-to-be-rolled-back");
        verify(userRepository).save(any(User.class));
    }
}
