package com.apexservices.service;

import com.apexservices.exception.ConflictException;
import com.apexservices.model.CompletionVerification;
import com.apexservices.model.WorkRequest;
import com.apexservices.repository.CompletionVerificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class OtpSecurityService {

    private static final Logger log = LoggerFactory.getLogger(OtpSecurityService.class);
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String AES_ALGORITHM = "AES";

    private final CompletionVerificationRepository verificationRepository;
    private final SecureRandom secureRandom = new SecureRandom();
    private final String hmacSecretKey;
    private final SecretKeySpec aesKeySpec;

    public OtpSecurityService(
            CompletionVerificationRepository verificationRepository,
            @Value("${security.otp.secret:ApexServicesAuthoritativeOtpSecretKey9876543210}") String hmacSecretKey) {
        this.verificationRepository = verificationRepository;
        this.hmacSecretKey = hmacSecretKey;

        // Derive 128-bit AES key from secret
        byte[] keyBytes = new byte[16];
        byte[] secretBytes = hmacSecretKey.getBytes(StandardCharsets.UTF_8);
        System.arraycopy(secretBytes, 0, keyBytes, 0, Math.min(secretBytes.length, 16));
        this.aesKeySpec = new SecretKeySpec(keyBytes, AES_ALGORITHM);
    }

    /**
     * Generates a cryptographically random 4-digit numeric OTP and stores its salted HMAC hash.
     * Encrypts the code for retrieval exclusively by the authenticated customer owner.
     */
    @Transactional
    public String generateAndStoreOtp(WorkRequest workRequest) {
        // Invalidate any previously unconsumed OTPs for this booking
        Optional<CompletionVerification> existing = verificationRepository
                .findTopByWorkRequestIdAndConsumedAtIsNullOrderByCreatedAtDesc(workRequest.getId());
        existing.ifPresent(v -> {
            v.setConsumedAt(LocalDateTime.now());
            verificationRepository.save(v);
        });

        // 1. Generate 4-digit OTP using SecureRandom
        String rawOtp = String.format("%04d", secureRandom.nextInt(10_000));

        // 2. Generate random 16-byte salt
        byte[] saltBytes = new byte[16];
        secureRandom.nextBytes(saltBytes);
        String saltHex = HexFormat.of().formatHex(saltBytes);

        // 3. Compute Keyed HMAC
        String otpHash = computeHmac(rawOtp, saltHex);

        // 4. Encrypt code for secure customer retrieval
        String encryptedCode = encrypt(rawOtp);

        // 5. Save record (valid for 24 hours, max 5 attempts)
        CompletionVerification verification = CompletionVerification.builder()
                .workRequest(workRequest)
                .otpHash(otpHash)
                .salt(saltHex)
                .encryptedCode(encryptedCode)
                .attemptCount(0)
                .maxAttempts(5)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        verificationRepository.save(verification);
        log.info("Secure completion OTP generated and stored for WorkRequest: {}", workRequest.getId());

        return rawOtp;
    }

    /**
     * Decrypts the active completion OTP for the customer owner.
     */
    @Transactional(readOnly = true)
    public String getActiveOtpForCustomer(String workRequestId) {
        CompletionVerification verification = verificationRepository
                .findTopByWorkRequestIdAndConsumedAtIsNullOrderByCreatedAtDesc(workRequestId)
                .orElse(null);

        if (verification == null || verification.isExpired() || verification.isConsumed() || verification.isLocked()) {
            return null;
        }

        if (verification.getEncryptedCode() == null) {
            return null;
        }

        return decrypt(verification.getEncryptedCode());
    }

    private String encrypt(String value) {
        try {
            javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance(AES_ALGORITHM);
            cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, aesKeySpec);
            byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encrypted);
        } catch (Exception e) {
            log.error("Failed to encrypt OTP", e);
            return null;
        }
    }

    private String decrypt(String hexEncrypted) {
        try {
            byte[] bytes = HexFormat.of().parseHex(hexEncrypted);
            javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance(AES_ALGORITHM);
            cipher.init(javax.crypto.Cipher.DECRYPT_MODE, aesKeySpec);
            byte[] decrypted = cipher.doFinal(bytes);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to decrypt OTP", e);
            return null;
        }
    }

    /**
     * Atomically verifies the submitted OTP against the stored salted HMAC.
     * Enforces attempt count limit, expiry, and single-use consumption.
     */
    @Transactional
    public boolean verifyAndConsumeOtp(String workRequestId, String submittedOtp) {
        if (submittedOtp == null || submittedOtp.trim().isEmpty()) {
            throw new IllegalArgumentException("Completion code cannot be empty");
        }

        CompletionVerification verification = verificationRepository
                .findTopByWorkRequestIdAndConsumedAtIsNullOrderByCreatedAtDesc(workRequestId)
                .orElseThrow(() -> new ConflictException("No active completion verification code found for this service request", "NO_ACTIVE_OTP"));

        if (verification.isExpired()) {
            throw new ConflictException("The completion verification code has expired. Please ask the customer to refresh.", "OTP_EXPIRED");
        }

        if (verification.isLocked()) {
            throw new ConflictException("Maximum verification attempts exceeded (5/5). Service completion verification is locked.", "VERIFICATION_LOCKED");
        }

        // Increment attempts atomically
        verification.setAttemptCount(verification.getAttemptCount() + 1);

        String computedHash = computeHmac(submittedOtp.trim(), verification.getSalt());

        // Constant-time comparison
        boolean matches = MessageDigest.isEqual(
                computedHash.getBytes(StandardCharsets.UTF_8),
                verification.getOtpHash().getBytes(StandardCharsets.UTF_8)
        );

        if (!matches) {
            verificationRepository.save(verification);
            int remaining = verification.getMaxAttempts() - verification.getAttemptCount();
            throw new IllegalArgumentException("Invalid completion code. Remaining attempts: " + Math.max(0, remaining));
        }

        // Successfully matched: consume single-use code
        verification.setConsumedAt(LocalDateTime.now());
        verificationRepository.save(verification);
        log.info("Completion OTP successfully verified and consumed for WorkRequest: {}", workRequestId);

        return true;
    }

    private String computeHmac(String data, String salt) {
        try {
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    (hmacSecretKey + salt).getBytes(StandardCharsets.UTF_8),
                    HMAC_ALGORITHM
            );
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hmacBytes);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to compute HMAC verifier for OTP", e);
        }
    }
}
