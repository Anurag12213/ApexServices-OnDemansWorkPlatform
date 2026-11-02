package com.apexservices.email;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Production-ready Brevo (formerly Sendinblue) v3 REST API Transactional Email Provider.
 * Communicates directly with https://api.brevo.com/v3/smtp/email using Spring's RestClient.
 */
@Service
@ConditionalOnProperty(name = "notification.email.provider", havingValue = "brevo", matchIfMissing = true)
@Slf4j
public class BrevoEmailProvider implements EmailProvider {

    private final String apiKey;
    private final String baseUrl;
    private final String fromEmail;
    private final String fromName;
    private final RestClient restClient;

    public BrevoEmailProvider(
            @Value("${brevo.api.key:}") String apiKey,
            @Value("${brevo.api.base-url:https://api.brevo.com/v3}") String baseUrl,
            @Value("${mail.from.email:notifications@apexservices.com}") String fromEmail,
            @Value("${mail.from.name:Apex Services}") String fromName,
            RestClient.Builder restClientBuilder) {

        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.baseUrl = baseUrl != null ? baseUrl.trim().replaceAll("/+$", "") : "https://api.brevo.com/v3";
        this.fromEmail = fromEmail != null ? fromEmail.trim().toLowerCase() : "notifications@apexservices.com";
        this.fromName = fromName != null ? fromName.trim() : "Apex Services";

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(8));

        this.restClient = restClientBuilder
                .baseUrl(this.baseUrl)
                .requestFactory(requestFactory)
                .defaultHeader("api-key", this.apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * Custom constructor for testing with pre-configured RestClient
     */
    public BrevoEmailProvider(String apiKey, String baseUrl, String fromEmail, String fromName, RestClient restClient) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.baseUrl = baseUrl != null ? baseUrl.trim().replaceAll("/+$", "") : "https://api.brevo.com/v3";
        this.fromEmail = fromEmail != null ? fromEmail.trim().toLowerCase() : "notifications@apexservices.com";
        this.fromName = fromName != null ? fromName.trim() : "Apex Services";
        this.restClient = restClient;
    }

    @PostConstruct
    public void validateConfiguration() {
        if (!isConfigured()) {
            log.warn("[EMAIL CONFIGURATION WARNING] Brevo API Key is unconfigured or using placeholder. Transactional email delivery will be rejected until a valid BREVO_API_KEY is supplied.");
        } else {
            log.info("[EMAIL CONFIGURATION] Brevo Email Provider initialized successfully. Sender: '{}' <{}>", fromName, fromEmail);
        }
    }

    public boolean isConfigured() {
        return !apiKey.isBlank() &&
                !apiKey.equalsIgnoreCase("xkeysib-your_brevo_api_key_placeholder") &&
                !apiKey.equalsIgnoreCase("your_brevo_api_key_here");
    }

    @Override
    public boolean sendTransactionalEmail(String toEmail, String toName, String subject, String htmlContent) {
        if (!isConfigured()) {
            log.error("[SECURITY] Refusing email delivery: BREVO_API_KEY is not configured in the active environment.");
            throw new IllegalStateException("Transactional email provider is not configured. Please supply a valid BREVO_API_KEY.");
        }

        if (toEmail == null || toEmail.isBlank() || !toEmail.contains("@")) {
            log.error("[SECURITY] Invalid recipient email address rejected.");
            throw new IllegalArgumentException("Recipient email address is invalid.");
        }

        // Build Brevo v3 JSON payload
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sender", Map.of("name", fromName, "email", fromEmail));
        payload.put("to", List.of(Map.of(
                "email", toEmail.trim().toLowerCase(),
                "name", (toName != null && !toName.isBlank()) ? toName.trim() : "Valued Customer"
        )));
        payload.put("subject", subject);
        payload.put("htmlContent", htmlContent);

        try {
            var response = restClient.post()
                    .uri("/smtp/email")
                    .header("api-key", apiKey)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();

            HttpStatusCode status = response.getStatusCode();
            if (status.is2xxSuccessful()) {
                log.info("[EMAIL DELIVERY SUCCESS] Transactional email accepted by Brevo for recipient: {}", maskEmail(toEmail));
                return true;
            } else {
                log.warn("[EMAIL DELIVERY WARNING] Brevo returned unexpected HTTP status: {}", status.value());
                return false;
            }
        } catch (RestClientException ex) {
            log.error("[EMAIL DELIVERY FAILED] Failed to deliver transactional email via Brevo to [{}]: {}",
                    maskEmail(toEmail), ex.getMessage());
            return false;
        }
    }

    @Override
    public String getProviderName() {
        return "BREVO";
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
