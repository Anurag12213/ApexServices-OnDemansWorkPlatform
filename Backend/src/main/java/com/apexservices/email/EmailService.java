package com.apexservices.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * High-Level Transactional Email Orchestrator.
 * Combines responsive HTML templates with the configured EmailProvider.
 *
 * CRITICAL SECURITY INVARIANT:
 * Raw OTP values and sensitive cryptographic tokens are strictly decoupled from log statements.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final EmailProvider emailProvider;
    private final EmailTemplateBuilder templateBuilder;

    @Value("${mail.from.name:Apex Services}")
    private String brandName;

    /**
     * Dispatches an OTP verification email to the user.
     *
     * @param toEmail            Recipient's email address
     * @param toName             Recipient's display name
     * @param rawOtp             Cryptographically generated 6-digit OTP code (transmitted in-memory only, never logged)
     * @param purposeDescription Friendly purpose label (e.g. "Account Registration", "Password Reset")
     * @param expiryMinutes      Configured expiry duration in minutes
     * @return true if accepted by provider, false otherwise
     */
    public boolean sendOtpEmail(String toEmail, String toName, String rawOtp, String purposeDescription, int expiryMinutes) {
        String subject = String.format("%s - Your Verification Code", brandName);
        String htmlContent = templateBuilder.buildOtpEmail(toName, rawOtp, purposeDescription, expiryMinutes);

        // Enforce safe logging: Recipient is masked, purpose is stated, OTP is strictly omitted
        log.info("[EMAIL DISPATCH] Requesting OTP delivery via [{}] for recipient: {} (Purpose: '{}', Expiry: {}m)",
                emailProvider.getProviderName(), maskEmail(toEmail), purposeDescription, expiryMinutes);

        return emailProvider.sendTransactionalEmail(toEmail, toName, subject, htmlContent);
    }

    /**
     * Dispatches a branded Welcome email to newly verified users.
     */
    public boolean sendWelcomeEmail(String toEmail, String toName, String portalUrl) {
        String subject = String.format("Welcome to %s!", brandName);
        String htmlContent = templateBuilder.buildWelcomeEmail(toName, portalUrl);

        log.info("[EMAIL DISPATCH] Requesting Welcome email via [{}] for recipient: {}",
                emailProvider.getProviderName(), maskEmail(toEmail));

        return emailProvider.sendTransactionalEmail(toEmail, toName, subject, htmlContent);
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
