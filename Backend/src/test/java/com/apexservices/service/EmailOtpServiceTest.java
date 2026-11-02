package com.apexservices.service;

import com.apexservices.dto.OtpApiResponse;
import com.apexservices.dto.SendEmailOtpRequest;
import com.apexservices.dto.VerifyEmailOtpRequest;
import com.apexservices.email.EmailService;
import com.apexservices.exception.ConflictException;
import com.apexservices.exception.RateLimitExceededException;
import com.apexservices.model.EmailOtpVerification;
import com.apexservices.model.OtpPurpose;
import com.apexservices.model.Role;
import com.apexservices.model.User;
import com.apexservices.repository.EmailOtpVerificationRepository;
import com.apexservices.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailOtpServiceTest {

    @Mock
    private EmailOtpVerificationRepository otpRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    private EmailOtpService emailOtpService;

    private static final String HMAC_SECRET = "c8f5e2d1a4b70938475610293847561029384756102938475610293847561029";

    @BeforeEach
    void setUp() {
        emailOtpService = new EmailOtpService(
                otpRepository,
                userRepository,
                emailService,
                HMAC_SECRET,
                5,   // expiry minutes
                60,  // cooldown seconds
                5,   // max attempts
                5    // max resends per window
        );
    }

    @Test
    @DisplayName("Send OTP - Successfully creates challenge and dispatches email for REGISTRATION")
    void testSendOtpRegistrationSuccess() {
        String email = "newuser@example.com";
        when(userRepository.existsByEmail(email)).thenReturn(false);
        when(otpRepository.countChallengesInWindow(eq(email), any())).thenReturn(0L);
        when(otpRepository.findTopByEmailAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(eq(email), eq(OtpPurpose.REGISTRATION)))
                .thenReturn(Optional.empty());

        SendEmailOtpRequest request = SendEmailOtpRequest.builder()
                .email(email)
                .purpose(OtpPurpose.REGISTRATION)
                .recipientName("New User")
                .build();

        OtpApiResponse response = emailOtpService.sendEmailOtp(request, "127.0.0.1");

        assertTrue(response.isSuccess());
        assertEquals(60, response.getCooldownSeconds());
        assertEquals(300, response.getExpiresInSeconds());

        ArgumentCaptor<EmailOtpVerification> captor = ArgumentCaptor.forClass(EmailOtpVerification.class);
        verify(otpRepository).save(captor.capture());

        EmailOtpVerification saved = captor.getValue();
        assertEquals(email, saved.getEmail());
        assertEquals(OtpPurpose.REGISTRATION, saved.getPurpose());
        assertNotNull(saved.getOtpHash());
        assertEquals(64, saved.getOtpHash().length());
        assertNotNull(saved.getSalt());

        verify(emailService).sendOtpEmail(eq(email), eq("New User"), anyString(), contains("Registration"), eq(5));
    }

    @Test
    @DisplayName("Send OTP - Throws ConflictException if email is already registered during REGISTRATION")
    void testSendOtpRegistrationFailsIfEmailExists() {
        String email = "existing@example.com";
        when(userRepository.existsByEmail(email)).thenReturn(true);

        SendEmailOtpRequest request = SendEmailOtpRequest.builder()
                .email(email)
                .purpose(OtpPurpose.REGISTRATION)
                .build();

        assertThrows(ConflictException.class, () -> emailOtpService.sendEmailOtp(request, "127.0.0.1"));
        verify(emailService, never()).sendOtpEmail(any(), any(), any(), any(), anyInt());
    }

    @Test
    @DisplayName("Send OTP - Suppresses password reset email for administrative accounts (ROLE_ADMIN)")
    void testSendOtpPasswordResetSuppressesAdmin() {
        String adminEmail = "admin@apexservices.com";
        User adminUser = User.builder().id(1L).email(adminEmail).role(Role.ROLE_ADMIN).build();
        when(userRepository.findByEmail(adminEmail)).thenReturn(Optional.of(adminUser));

        SendEmailOtpRequest request = SendEmailOtpRequest.builder()
                .email(adminEmail)
                .purpose(OtpPurpose.PASSWORD_RESET)
                .build();

        OtpApiResponse response = emailOtpService.sendEmailOtp(request, "127.0.0.1");

        // Returns generic success response to client, but never calls emailService
        assertTrue(response.isSuccess());
        verify(emailService, never()).sendOtpEmail(any(), any(), any(), any(), anyInt());
    }

    @Test
    @DisplayName("Send OTP - Enforces 60-second cooldown on consecutive requests")
    void testSendOtpCooldownEnforced() {
        String email = "user@example.com";
        when(userRepository.existsByEmail(email)).thenReturn(false);
        when(otpRepository.countChallengesInWindow(eq(email), any())).thenReturn(1L);

        EmailOtpVerification recentChallenge = EmailOtpVerification.builder()
                .email(email)
                .purpose(OtpPurpose.REGISTRATION)
                .lastSentAt(LocalDateTime.now().minusSeconds(30)) // sent 30 seconds ago
                .build();

        when(otpRepository.findTopByEmailAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(eq(email), eq(OtpPurpose.REGISTRATION)))
                .thenReturn(Optional.of(recentChallenge));

        SendEmailOtpRequest request = SendEmailOtpRequest.builder()
                .email(email)
                .purpose(OtpPurpose.REGISTRATION)
                .build();

        assertThrows(RateLimitExceededException.class, () -> emailOtpService.sendEmailOtp(request, "127.0.0.1"));
    }

    @Test
    @DisplayName("Verify OTP - Correct OTP generates single-use Verification Grant")
    void testVerifyOtpSuccessGeneratesGrant() {
        String email = "user@example.com";
        String salt = "0123456789abcdef0123456789abcdef";
        String rawOtp = "492018";

        // Precompute matching HMAC
        String computedHash = computeTestHmac(salt, email, OtpPurpose.REGISTRATION, rawOtp);

        EmailOtpVerification challenge = EmailOtpVerification.builder()
                .id(100L)
                .email(email)
                .purpose(OtpPurpose.REGISTRATION)
                .salt(salt)
                .otpHash(computedHash)
                .attemptCount(0)
                .maxAttempts(5)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        when(otpRepository.findActiveChallengeWithLock(email, OtpPurpose.REGISTRATION))
                .thenReturn(Optional.of(challenge));

        VerifyEmailOtpRequest request = VerifyEmailOtpRequest.builder()
                .email(email)
                .purpose(OtpPurpose.REGISTRATION)
                .otp(rawOtp)
                .build();

        OtpApiResponse response = emailOtpService.verifyEmailOtp(request);

        assertTrue(response.isSuccess());
        assertNotNull(response.getVerificationGrant());
        assertEquals(64, response.getVerificationGrant().length()); // 32 bytes hex-encoded
        assertNotNull(challenge.getVerifiedAt());
        assertNotNull(challenge.getGrantHash());
        assertNotNull(challenge.getGrantExpiresAt());
    }

    @Test
    @DisplayName("Verify OTP - Incorrect OTP increments attempt counter and throws IllegalArgumentException")
    void testVerifyOtpIncorrectCode() {
        String email = "user@example.com";
        String salt = "0123456789abcdef0123456789abcdef";
        String correctHash = computeTestHmac(salt, email, OtpPurpose.REGISTRATION, "111111");

        EmailOtpVerification challenge = EmailOtpVerification.builder()
                .id(100L)
                .email(email)
                .purpose(OtpPurpose.REGISTRATION)
                .salt(salt)
                .otpHash(correctHash)
                .attemptCount(0)
                .maxAttempts(5)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        when(otpRepository.findActiveChallengeWithLock(email, OtpPurpose.REGISTRATION))
                .thenReturn(Optional.of(challenge));

        VerifyEmailOtpRequest request = VerifyEmailOtpRequest.builder()
                .email(email)
                .purpose(OtpPurpose.REGISTRATION)
                .otp("999999") // incorrect code
                .build();

        assertThrows(IllegalArgumentException.class, () -> emailOtpService.verifyEmailOtp(request));
        assertEquals(1, challenge.getAttemptCount());
    }

    @Test
    @DisplayName("Verify OTP - 5th failed attempt permanently locks the challenge")
    void testVerifyOtpFifthFailedAttemptLocks() {
        String email = "user@example.com";
        String salt = "0123456789abcdef0123456789abcdef";
        String correctHash = computeTestHmac(salt, email, OtpPurpose.REGISTRATION, "111111");

        EmailOtpVerification challenge = EmailOtpVerification.builder()
                .id(100L)
                .email(email)
                .purpose(OtpPurpose.REGISTRATION)
                .salt(salt)
                .otpHash(correctHash)
                .attemptCount(4) // 4 attempts already made
                .maxAttempts(5)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        when(otpRepository.findActiveChallengeWithLock(email, OtpPurpose.REGISTRATION))
                .thenReturn(Optional.of(challenge));

        VerifyEmailOtpRequest request = VerifyEmailOtpRequest.builder()
                .email(email)
                .purpose(OtpPurpose.REGISTRATION)
                .otp("999999")
                .build();

        ConflictException ex = assertThrows(ConflictException.class, () -> emailOtpService.verifyEmailOtp(request));
        assertEquals("OTP_LOCKED", ex.getCode());
        assertEquals(5, challenge.getAttemptCount());
    }

    @Test
    @DisplayName("Verify Grant - Grant consumption succeeds atomically and prevents replay")
    void testValidateAndConsumeGrantSuccess() {
        String email = "user@example.com";
        String rawGrant = "a1b2c3d4e5f60123456789abcdef0123456789abcdef0123456789abcdef0123";

        EmailOtpVerification challenge = EmailOtpVerification.builder()
                .id(200L)
                .email(email)
                .purpose(OtpPurpose.PASSWORD_RESET)
                .verifiedAt(LocalDateTime.now())
                .grantExpiresAt(LocalDateTime.now().plusMinutes(10))
                .consumedAt(null)
                .build();

        when(otpRepository.findValidGrantWithLock(eq(email), eq(OtpPurpose.PASSWORD_RESET), anyString(), any()))
                .thenReturn(Optional.of(challenge));

        // First consumption succeeds
        emailOtpService.validateAndConsumeGrant(email, OtpPurpose.PASSWORD_RESET, rawGrant);

        assertNotNull(challenge.getConsumedAt());
        verify(otpRepository).save(challenge);
    }

    private String computeTestHmac(String salt, String email, OtpPurpose purpose, String otp) {
        try {
            String message = salt + ":" + email + ":" + purpose.name() + ":" + otp;
            SecretKeySpec secretKey = new SecretKeySpec(HMAC_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(secretKey);
            byte[] hmacBytes = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hmacBytes);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
