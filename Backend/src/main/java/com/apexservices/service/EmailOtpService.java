package com.apexservices.service;

import com.apexservices.dto.request.*;
import com.apexservices.dto.response.*;
import com.apexservices.email.EmailService;
import com.apexservices.exception.ConflictException;
import com.apexservices.exception.RateLimitExceededException;
import com.apexservices.model.EmailOtpVerification;
import com.apexservices.model.OtpPurpose;
import com.apexservices.model.Role;
import com.apexservices.model.User;
import com.apexservices.repository.EmailOtpVerificationRepository;
import com.apexservices.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Enterprise Centralized Email OTP Verification Service.
 * Implements cryptographic challenge generation, HMAC-SHA256 verification,
 * rolling-window rate limits, resend cooldowns, and single-use verification grants.
 *
 * CRITICAL SECURITY INVARIANTS:
 * 1. Plaintext OTPs are NEVER persisted to database tables.
 * 2. Plaintext OTPs, verification grants, and HMAC keys are NEVER written to logs.
 * 3. Constant-time comparison prevents timing analysis.
 * 4. Administrator password reset requests from public endpoints are suppressed.
 */
@Service
@Slf4j
public class EmailOtpService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String SHA256_ALGORITHM = "SHA-256";

    private final EmailOtpVerificationRepository otpRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    private final String hmacSecret;
    private final int expiryMinutes;
    private final int cooldownSeconds;
    private final int maxAttempts;
    private final int maxResendsPerWindow;

    public EmailOtpService(
            EmailOtpVerificationRepository otpRepository,
            UserRepository userRepository,
            EmailService emailService,
            @Value("${security.email-otp.hmac-secret:c8f5e2d1a4b70938475610293847561029384756102938475610293847561029}") String hmacSecret,
            @Value("${otp.expiry.minutes:5}") int expiryMinutes,
            @Value("${otp.resend.cooldown.seconds:60}") int cooldownSeconds,
            @Value("${otp.max.attempts:5}") int maxAttempts,
            @Value("${otp.max.resends.per.window:5}") int maxResendsPerWindow) {

        this.otpRepository = otpRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.hmacSecret = hmacSecret != null ? hmacSecret.trim() : "";
        this.expiryMinutes = Math.max(1, expiryMinutes);
        this.cooldownSeconds = Math.max(10, cooldownSeconds);
        this.maxAttempts = Math.max(1, maxAttempts);
        this.maxResendsPerWindow = Math.max(1, maxResendsPerWindow);
    }

    @PostConstruct
    public void validateSecurityConfiguration() {
        if (hmacSecret.length() < 32) {
            log.warn("[SECURITY CONFIGURATION WARNING] EMAIL_OTP_HMAC_SECRET length is under recommended 256 bits.");
        }
    }

    /**
     * Generates and dispatches a fresh 6-digit email OTP challenge.
     */
    @Transactional
    public OtpApiResponse sendEmailOtp(SendEmailOtpRequest request, String clientIp) {
        String email = normalizeEmail(request.getEmail());
        OtpPurpose purpose = request.getPurpose();
        LocalDateTime now = LocalDateTime.now();

        // 1. Contextual validation based on challenge purpose
        User associatedUser = null;
        if (purpose == OtpPurpose.REGISTRATION) {
            if (userRepository.existsByEmail(email)) {
                throw new ConflictException("An account with this email address already exists. Please sign in.", "EMAIL_ALREADY_EXISTS");
            }
        } else if (purpose == OtpPurpose.PASSWORD_RESET) {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                associatedUser = userOpt.get();
                // STRICT SECURITY RULE: Public password reset for ROLE_ADMIN is suppressed
                if (associatedUser.getRole() == Role.ROLE_ADMIN) {
                    log.warn("[SECURITY ALERT] Public OTP password reset suppressed for administrative account [{}]", maskEmail(email));
                    return OtpApiResponse.challengeDispatched(
                            "If an account is associated with this email, a verification code has been dispatched.",
                            cooldownSeconds,
                            expiryMinutes * 60
                    );
                }
            } else {
                // Prevent email enumeration: return standard success response without sending email
                return OtpApiResponse.challengeDispatched(
                        "If an account is associated with this email, a verification code has been dispatched.",
                        cooldownSeconds,
                        expiryMinutes * 60
                );
            }
        }

        // 2. Rolling-window dispatch rate limiting
        long challengesInWindow = otpRepository.countChallengesInWindow(email, now.minusHours(1));
        if (challengesInWindow >= maxResendsPerWindow) {
            throw new RateLimitExceededException("Too many verification attempts. Please wait an hour before requesting a new code.", 3600);
        }

        // 3. Resend cooldown enforcement on existing active challenge
        Optional<EmailOtpVerification> activeOpt = otpRepository.findTopByEmailAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(email, purpose);
        if (activeOpt.isPresent()) {
            EmailOtpVerification active = activeOpt.get();
            long secondsSinceLastSent = Duration.between(active.getLastSentAt(), now).getSeconds();
            if (secondsSinceLastSent < cooldownSeconds) {
                long remainingCooldown = cooldownSeconds - secondsSinceLastSent;
                throw new RateLimitExceededException("Please wait " + remainingCooldown + " seconds before requesting a new code.", (int) remainingCooldown);
            }
            // Invalidate the prior challenge
            active.setConsumedAt(now);
            otpRepository.save(active);
        }

        // 4. Generate cryptographic challenge
        String rawOtp = generateSecureOtpCode();
        String saltHex = generateRandomSaltHex();
        String otpHash = computeHmacSha256(saltHex, email, purpose, rawOtp);
        String ipHash = computeSha256(clientIp != null ? clientIp : "unknown");

        EmailOtpVerification challenge = EmailOtpVerification.builder()
                .email(email)
                .user(associatedUser)
                .otpHash(otpHash)
                .salt(saltHex)
                .purpose(purpose)
                .expiresAt(now.plusMinutes(expiryMinutes))
                .attemptCount(0)
                .maxAttempts(maxAttempts)
                .resendCount(0)
                .maxResends(maxResendsPerWindow)
                .lastSentAt(now)
                .ipHash(ipHash)
                .createdAt(now)
                .updatedAt(now)
                .build();

        otpRepository.save(challenge);

        // 5. Dispatch email via EmailService (rawOtp passed only in memory)
        String displayName = request.getRecipientName();
        if (displayName == null && associatedUser != null) {
            displayName = associatedUser.getFullName();
        }

        emailService.sendOtpEmail(email, displayName, rawOtp, purpose.getDescription(), expiryMinutes);

        return OtpApiResponse.challengeDispatched(
                "A 6-digit verification code has been dispatched to your email address.",
                cooldownSeconds,
                expiryMinutes * 60
        );
    }

    /**
     * Re-dispatches a fresh OTP for an existing active challenge, adhering to cooldowns and attempt caps.
     */
    @Transactional
    public OtpApiResponse resendEmailOtp(ResendEmailOtpRequest request, String clientIp) {
        String email = normalizeEmail(request.getEmail());
        OtpPurpose purpose = request.getPurpose();
        LocalDateTime now = LocalDateTime.now();

        // 1. Rate limiting check across 1 hour
        long challengesInWindow = otpRepository.countChallengesInWindow(email, now.minusHours(1));
        if (challengesInWindow >= maxResendsPerWindow) {
            throw new RateLimitExceededException("Too many verification attempts. Please wait an hour before requesting a new code.", 3600);
        }

        // 2. Cooldown check against previous active challenge
        Optional<EmailOtpVerification> activeOpt = otpRepository.findTopByEmailAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(email, purpose);
        int currentResendCount = 0;
        User associatedUser = null;

        if (activeOpt.isPresent()) {
            EmailOtpVerification active = activeOpt.get();
            long secondsSinceLastSent = Duration.between(active.getLastSentAt(), now).getSeconds();
            if (secondsSinceLastSent < cooldownSeconds) {
                long remainingCooldown = cooldownSeconds - secondsSinceLastSent;
                throw new RateLimitExceededException("Please wait " + remainingCooldown + " seconds before requesting another code.", (int) remainingCooldown);
            }
            currentResendCount = active.getResendCount() + 1;
            if (currentResendCount > maxResendsPerWindow) {
                throw new RateLimitExceededException("Maximum resend attempts reached for this session. Please wait before retrying.", 1800);
            }
            associatedUser = active.getUser();
            // Invalidate the prior challenge
            active.setConsumedAt(now);
            otpRepository.save(active);
        }

        // 3. Generate fresh OTP challenge
        String rawOtp = generateSecureOtpCode();
        String saltHex = generateRandomSaltHex();
        String otpHash = computeHmacSha256(saltHex, email, purpose, rawOtp);
        String ipHash = computeSha256(clientIp != null ? clientIp : "unknown");

        EmailOtpVerification challenge = EmailOtpVerification.builder()
                .email(email)
                .user(associatedUser)
                .otpHash(otpHash)
                .salt(saltHex)
                .purpose(purpose)
                .expiresAt(now.plusMinutes(expiryMinutes))
                .attemptCount(0)
                .maxAttempts(maxAttempts)
                .resendCount(currentResendCount)
                .maxResends(maxResendsPerWindow)
                .lastSentAt(now)
                .ipHash(ipHash)
                .createdAt(now)
                .updatedAt(now)
                .build();

        otpRepository.save(challenge);

        String displayName = request.getRecipientName();
        if (displayName == null && associatedUser != null) {
            displayName = associatedUser.getFullName();
        }

        emailService.sendOtpEmail(email, displayName, rawOtp, purpose.getDescription(), expiryMinutes);

        return OtpApiResponse.challengeDispatched(
                "A new 6-digit verification code has been dispatched to your email address.",
                cooldownSeconds,
                expiryMinutes * 60
        );
    }

    /**
     * Atomically verifies the submitted OTP against the active challenge using pessimistic write locking.
     * On success, generates and returns a single-use verification grant.
     */
    @Transactional
    public OtpApiResponse verifyEmailOtp(VerifyEmailOtpRequest request) {
        String email = normalizeEmail(request.getEmail());
        OtpPurpose purpose = request.getPurpose();
        String submittedOtp = request.getOtp() != null ? request.getOtp().trim() : "";
        LocalDateTime now = LocalDateTime.now();

        // 1. Acquire row lock on active unconsumed challenge
        EmailOtpVerification challenge = otpRepository.findActiveChallengeWithLock(email, purpose)
                .orElseThrow(() -> new ConflictException("No active verification challenge found. Please request a new code.", "NO_ACTIVE_CHALLENGE"));

        if (challenge.isExpired()) {
            challenge.setConsumedAt(now);
            otpRepository.save(challenge);
            throw new ConflictException("The verification code has expired. Please request a fresh code.", "OTP_EXPIRED");
        }

        if (challenge.isLocked()) {
            throw new ConflictException("Maximum verification attempts exceeded. This code is locked. Please request a new code.", "OTP_LOCKED");
        }

        // 2. Increment attempt counter
        challenge.setAttemptCount(challenge.getAttemptCount() + 1);

        // 3. Constant-time HMAC comparison
        String computedHash = computeHmacSha256(challenge.getSalt(), email, purpose, submittedOtp);
        boolean matches = MessageDigest.isEqual(
                computedHash.getBytes(StandardCharsets.UTF_8),
                challenge.getOtpHash().getBytes(StandardCharsets.UTF_8)
        );

        if (!matches) {
            otpRepository.save(challenge);
            int remainingAttempts = challenge.getMaxAttempts() - challenge.getAttemptCount();
            if (remainingAttempts <= 0) {
                throw new ConflictException("Incorrect verification code. Maximum attempts exceeded. Code is now locked.", "OTP_LOCKED");
            }
            throw new IllegalArgumentException("Incorrect verification code. Remaining attempts: " + remainingAttempts);
        }

        // 4. Verification Successful: Generate single-use Verification Grant
        String rawGrant = generateVerificationGrantHex();
        String grantHash = computeSha256(rawGrant);

        challenge.setVerifiedAt(now);
        challenge.setGrantHash(grantHash);
        challenge.setGrantExpiresAt(now.plusMinutes(10)); // 10-minute validity
        otpRepository.save(challenge);

        log.info("[OTP VERIFIED] Challenge successfully verified for email: {} (Purpose: '{}')", maskEmail(email), purpose);

        return OtpApiResponse.verified(
                "Verification successful.",
                rawGrant,
                600
        );
    }

    /**
     * Atomically validates and consumes a verification grant for a sensitive operation (e.g. Password Reset, Registration).
     * Prevents replay attacks by stamping consumedAt within a pessimistic write lock.
     */
    @Transactional
    public void validateAndConsumeGrant(String email, OtpPurpose purpose, String verificationGrant) {
        if (verificationGrant == null || verificationGrant.isBlank()) {
            throw new IllegalArgumentException("Verification grant token is required.");
        }

        String normalizedEmail = normalizeEmail(email);
        String grantHash = computeSha256(verificationGrant.trim());
        LocalDateTime now = LocalDateTime.now();

        EmailOtpVerification challenge = otpRepository.findValidGrantWithLock(normalizedEmail, purpose, grantHash, now)
                .orElseThrow(() -> new ConflictException("Invalid or expired verification grant. Please complete verification again.", "INVALID_GRANT"));

        // Atomically consume single-use grant
        challenge.setConsumedAt(now);
        otpRepository.save(challenge);

        log.info("[GRANT CONSUMED] Verification grant consumed for email: {} (Purpose: '{}')", maskEmail(normalizedEmail), purpose);
    }

    // ==========================================
    // Cryptographic Helpers
    // ==========================================

    @Transactional
    public void confirmEmailChange(String principalUsername, VerifyEmailOtpRequest request) {
        request.setPurpose(OtpPurpose.EMAIL_CHANGE);
        OtpApiResponse verifyResponse = verifyEmailOtp(request);

        String newEmail = normalizeEmail(request.getEmail());
        validateAndConsumeGrant(newEmail, OtpPurpose.EMAIL_CHANGE, verifyResponse.getVerificationGrant());

        User user = userRepository.findByEmail(principalUsername)
                .or(() -> userRepository.findByIdentifier(principalUsername))
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found."));

        user.setEmail(newEmail);
        userRepository.save(user);

        log.info("[USER AUDIT] User [id={}] successfully updated email address", user.getId());
    }

    private String generateSecureOtpCode() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }

    private String generateRandomSaltHex() {
        byte[] salt = new byte[16];
        secureRandom.nextBytes(salt);
        return HexFormat.of().formatHex(salt);
    }

    private String generateVerificationGrantHex() {
        byte[] grantBytes = new byte[32];
        secureRandom.nextBytes(grantBytes);
        return HexFormat.of().formatHex(grantBytes);
    }

    private String computeHmacSha256(String salt, String email, OtpPurpose purpose, String otp) {
        try {
            String message = salt + ":" + email + ":" + purpose.name() + ":" + otp;
            SecretKeySpec secretKey = new SecretKeySpec(hmacSecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(secretKey);
            byte[] hmacBytes = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hmacBytes);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to calculate HMAC verification hash", e);
        }
    }

    private String computeSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance(SHA256_ALGORITHM);
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", e);
        }
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email address cannot be blank.");
        }
        return email.trim().toLowerCase();
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        String[] parts = email.split("@", 2);
        String local = parts[0];
        String domain = parts[1];
        String maskedLocal = local.length() <= 2 ? local.charAt(0) + "*" : local.substring(0, 2) + "***";
        return maskedLocal + "@" + domain;
    }
}
