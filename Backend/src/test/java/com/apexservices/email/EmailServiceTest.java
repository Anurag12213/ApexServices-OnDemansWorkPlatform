package com.apexservices.email;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private EmailProvider emailProvider;

    private EmailTemplateBuilder templateBuilder;
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        templateBuilder = new EmailTemplateBuilder("Apex Services", "support@apexservices.com");
        emailService = new EmailService(emailProvider, templateBuilder);
        ReflectionTestUtils.setField(emailService, "brandName", "Apex Services");
    }

    @Test
    @DisplayName("EmailService - Successfully dispatches OTP email through configured provider")
    void testSendOtpEmailDelegatesProperly() {
        when(emailProvider.getProviderName()).thenReturn("BREVO");
        when(emailProvider.sendTransactionalEmail(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(true);

        boolean result = emailService.sendOtpEmail(
                "customer@example.com",
                "Customer Name",
                "492018",
                "Account Registration",
                5
        );

        assertTrue(result);
        verify(emailProvider, times(1)).sendTransactionalEmail(
                eq("customer@example.com"),
                eq("Customer Name"),
                contains("Apex Services"),
                contains("492018")
        );
    }

    @Test
    @DisplayName("EmailService - Successfully dispatches Welcome email through configured provider")
    void testSendWelcomeEmailDelegatesProperly() {
        when(emailProvider.getProviderName()).thenReturn("BREVO");
        when(emailProvider.sendTransactionalEmail(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(true);

        boolean result = emailService.sendWelcomeEmail(
                "newuser@example.com",
                "New User",
                "https://apexservicesondemand.netlify.app"
        );

        assertTrue(result);
        verify(emailProvider, times(1)).sendTransactionalEmail(
                eq("newuser@example.com"),
                eq("New User"),
                contains("Welcome to Apex Services"),
                contains("https://apexservicesondemand.netlify.app")
        );
    }
}
