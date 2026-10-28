package com.apexservices.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Unit Tests - InputSanitizer & SQLi/XSS Defense")
public class InputSanitizerTest {

    @Test
    @DisplayName("Should validate safe strings as SQL-safe")
    void testSafeSqlInputs() {
        assertTrue(InputSanitizer.isSqlSafe("customer@example.com"));
        assertTrue(InputSanitizer.isSqlSafe("+919876543210"));
        assertTrue(InputSanitizer.isSqlSafe("102 Green Heights, Mumbai 400001"));
        assertTrue(InputSanitizer.isSqlSafe("Looking for an experienced carpenter for door fix"));
        assertTrue(InputSanitizer.isSqlSafe(null));
        assertTrue(InputSanitizer.isSqlSafe("   "));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "' OR '1'='1",
            "' or 1=1--",
            "admin'--",
            "1; DROP TABLE users;",
            "' UNION SELECT 1, 'admin', 'password'--",
            "EXEC xp_cmdshell('dir')",
            "/* inline comment */ 1=1",
            "'; TRUNCATE TABLE work_requests;--"
    })
    @DisplayName("Should detect and block potential SQL Injection patterns")
    void testSqlInjectionDetection(String maliciousInput) {
        assertFalse(InputSanitizer.isSqlSafe(maliciousInput),
                "Should detect SQL injection in: " + maliciousInput);
    }

    @Test
    @DisplayName("Should validate safe plain text as XSS-safe")
    void testSafeXssInputs() {
        assertTrue(InputSanitizer.isXssSafe("Door handle is loose and needs tightening"));
        assertTrue(InputSanitizer.isXssSafe("Apex Services 2026"));
        assertTrue(InputSanitizer.isXssSafe(null));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "<script>alert('xss')</script>",
            "<img src='x' onerror='alert(1)'>",
            "javascript:void(0)",
            "<body onload=alert('hack')>",
            "<svg/onload=alert('xss')>",
            "<iframe src='http://attacker.com'></iframe>"
    })
    @DisplayName("Should detect and block Cross-Site Scripting (XSS) patterns")
    void testXssDetection(String maliciousInput) {
        assertFalse(InputSanitizer.isXssSafe(maliciousInput),
                "Should detect XSS vector in: " + maliciousInput);
    }

    @Test
    @DisplayName("Should sanitize text by stripping HTML tags and control characters")
    void testSanitization() {
        String dirty = "<script>alert('bad')</script><b>Hello</b> World!\u0000\u0007";
        String clean = InputSanitizer.sanitize(dirty);
        assertNotNull(clean);
        assertFalse(clean.contains("<script>"));
        assertFalse(clean.contains("<b>"));
        assertFalse(clean.contains("\u0000"));
        assertEquals("alert('bad')Hello World!", clean);
    }

    @Test
    @DisplayName("Should validate correct email addresses")
    void testEmailValidation() {
        assertTrue(InputSanitizer.isValidEmail("anita.desai@gmail.com"));
        assertTrue(InputSanitizer.isValidEmail("partner1@apexservices.com"));
        assertTrue(InputSanitizer.isValidEmail("admin.super_user+tag@domain.co.in"));

        assertFalse(InputSanitizer.isValidEmail("not-an-email"));
        assertFalse(InputSanitizer.isValidEmail("@missingusername.com"));
        assertFalse(InputSanitizer.isValidEmail("missing.domain@"));
        assertFalse(InputSanitizer.isValidEmail("admin' OR '1'='1@domain.com"));
        assertFalse(InputSanitizer.isValidEmail(null));
        assertFalse(InputSanitizer.isValidEmail("   "));
    }

    @Test
    @DisplayName("Should validate correct phone numbers")
    void testPhoneValidation() {
        assertTrue(InputSanitizer.isValidPhone("+919876543210"));
        assertTrue(InputSanitizer.isValidPhone("9876543210"));
        assertTrue(InputSanitizer.isValidPhone("+14155552671"));

        assertFalse(InputSanitizer.isValidPhone("123")); // Too short
        assertFalse(InputSanitizer.isValidPhone("9876543210987654321")); // Too long
        assertFalse(InputSanitizer.isValidPhone("phone1234567")); // Alphanumeric
        assertFalse(InputSanitizer.isValidPhone(null));
    }
}
