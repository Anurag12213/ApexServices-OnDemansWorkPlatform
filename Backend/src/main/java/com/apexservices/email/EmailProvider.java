package com.apexservices.email;

/**
 * Pluggable Email Provider interface.
 * Decouples high-level business notifications from specific external transactional email gateways.
 */
public interface EmailProvider {

    /**
     * Send a single transactional email with HTML content.
     *
     * @param toEmail     The recipient's destination email address
     * @param toName      The recipient's full name (or fallback display name)
     * @param subject     Email subject line
     * @param htmlContent Fully rendered, branded HTML email body
     * @return true if successfully accepted by the provider gateway, false otherwise
     */
    boolean sendTransactionalEmail(String toEmail, String toName, String subject, String htmlContent);

    /**
     * Identifies the active provider implementation (e.g. BREVO, MOCK, SENDGRID).
     */
    String getProviderName();
}
