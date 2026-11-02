package com.apexservices.email;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MockEmailProviderTest {

    @Test
    @DisplayName("Mock Provider - Successfully simulates transactional delivery")
    void testMockDeliveryAlwaysSucceeds() {
        MockEmailProvider provider = new MockEmailProvider();

        assertEquals("MOCK", provider.getProviderName());

        boolean result = provider.sendTransactionalEmail(
                "tester@example.com",
                "Test User",
                "Test Subject",
                "<p>Test Content</p>"
        );

        assertTrue(result);
    }
}
