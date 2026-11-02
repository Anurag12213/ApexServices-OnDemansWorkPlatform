package com.apexservices.email;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class BrevoEmailProviderTest {

    private RestClient.Builder restClientBuilder;
    private MockRestServiceServer mockServer;
    private BrevoEmailProvider provider;

    private static final String TEST_API_KEY = "xkeysib-test-valid-key-123456789";
    private static final String BASE_URL = "https://api.brevo.com/v3";
    private static final String FROM_EMAIL = "notifications@apexservices.com";
    private static final String FROM_NAME = "Apex Services";

    @BeforeEach
    void setUp() {
        restClientBuilder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();

        provider = new BrevoEmailProvider(
                TEST_API_KEY,
                BASE_URL,
                FROM_EMAIL,
                FROM_NAME,
                restClientBuilder.baseUrl(BASE_URL).build()
        );
    }

    @Test
    @DisplayName("Brevo Provider - Successful delivery returns true on 201 Created")
    void testSuccessfulEmailDelivery() {
        mockServer.expect(requestTo(BASE_URL + "/smtp/email"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("api-key", TEST_API_KEY))
                .andExpect(header("Content-Type", MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.sender.email").value(FROM_EMAIL))
                .andExpect(jsonPath("$.sender.name").value(FROM_NAME))
                .andExpect(jsonPath("$.to[0].email").value("customer@example.com"))
                .andExpect(jsonPath("$.subject").value("Your Verification Code"))
                .andRespond(withStatus(HttpStatus.CREATED)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"messageId\":\"<20261102.123456@smtp-relay.brevo.com>\"}"));

        boolean result = provider.sendTransactionalEmail(
                "customer@example.com",
                "Customer Name",
                "Your Verification Code",
                "<p>Your code is 123456</p>"
        );

        assertTrue(result);
        mockServer.verify();
    }

    @Test
    @DisplayName("Brevo Provider - Returns false when Brevo returns 400 Bad Request")
    void testBrevoReturnsBadRequest() {
        mockServer.expect(requestTo(BASE_URL + "/smtp/email"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withBadRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"code\":\"invalid_parameter\",\"message\":\"Invalid email address\"}"));

        boolean result = provider.sendTransactionalEmail(
                "bad-email@example.com",
                "Bad User",
                "Subject",
                "<p>Content</p>"
        );

        assertFalse(result);
        mockServer.verify();
    }

    @Test
    @DisplayName("Brevo Provider - Returns false on 401 Unauthorized (Invalid API Key)")
    void testBrevoUnauthorized() {
        mockServer.expect(requestTo(BASE_URL + "/smtp/email"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withUnauthorizedRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"code\":\"unauthorized\",\"message\":\"Key not found\"}"));

        boolean result = provider.sendTransactionalEmail(
                "user@example.com",
                "User",
                "Subject",
                "<p>Content</p>"
        );

        assertFalse(result);
        mockServer.verify();
    }

    @Test
    @DisplayName("Brevo Provider - Throws IllegalStateException when API key is unconfigured")
    void testUnconfiguredApiKeyThrowsException() {
        BrevoEmailProvider unconfigured = new BrevoEmailProvider(
                "",
                BASE_URL,
                FROM_EMAIL,
                FROM_NAME,
                restClientBuilder.build()
        );

        assertFalse(unconfigured.isConfigured());
        assertThrows(IllegalStateException.class, () ->
                unconfigured.sendTransactionalEmail("user@example.com", "User", "Subject", "<p>Content</p>")
        );
    }

    @Test
    @DisplayName("Brevo Provider - Throws IllegalArgumentException on invalid email format")
    void testInvalidRecipientEmailThrowsException() {
        assertThrows(IllegalArgumentException.class, () ->
                provider.sendTransactionalEmail("invalid-email-no-at-sign", "User", "Subject", "<p>Content</p>")
        );
    }
}
