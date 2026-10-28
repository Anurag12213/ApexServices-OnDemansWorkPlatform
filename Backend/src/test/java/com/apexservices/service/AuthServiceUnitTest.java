package com.apexservices.service;

import com.apexservices.dto.AuthResponse;
import com.apexservices.dto.LoginRequest;
import com.apexservices.dto.RegisterRequest;
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
    @DisplayName("Should successfully register customer with hashed password")
    void testRegister_Success() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Sunita Rao")
                .email("sunita.rao@apexservices.com")
                .mobileNumber("+919811223344")
                .password("strongPassword123")
                .role(Role.ROLE_CUSTOMER)
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
        verify(userRepository).save(any(User.class));
    }
}
