package com.apexservices.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Dedicated Mock Email Provider for explicit local development and automated unit/integration testing.
 * Strictly active ONLY when 'notification.email.provider=mock' is explicitly declared in configuration.
 *
 * CRITICAL SECURITY INVARIANT:
 * This provider NEVER logs the actual OTP code or sensitive payload secrets, adhering strictly
 * to the zero-leak logging specification.
 */
@Service
@ConditionalOnProperty(name = "notification.email.provider", havingValue = "mock")
@Slf4j
public class MockEmailProvider implements EmailProvider {

    @Override
    public boolean sendTransactionalEmail(String toEmail, String toName, String subject, String htmlContent) {
        // Enforce safe logging: recipient is masked, code/token is omitted entirely
        log.info("[MOCK EMAIL DISPATCH] Recipient: {}, Subject: '{}', Status: SIMULATED_SUCCESS (Actual secret/code omitted)",
                maskEmail(toEmail), subject);
        return true;
    }

    @Override
    public String getProviderName() {
        return "MOCK";
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
