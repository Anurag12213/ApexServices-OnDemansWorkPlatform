package com.apexservices.security;

import java.util.regex.Pattern;

/**
 * Enterprise Input Sanitizer & SQL Injection Defense Utility.
 * Provides multi-layer defensive filtering against:
 * - SQL Injection metacharacters and keyword sequences
 * - Cross-Site Scripting (XSS) tags and script vectors
 * - Unwanted control characters and buffer overrun inputs
 */
public final class InputSanitizer {

    private InputSanitizer() {
        // Private constructor for utility class
    }

    // High-risk SQL injection keyword sequences (UNION SELECT, DROP TABLE, OR 1=1, comment markers)
    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
            "(?i)(" +
            "\\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE|TRUNCATE|DECLARE)\\b|" +
            "(--|\\/\\*|\\*\\/|;)|" +
            "(\\bOR\\b\\s+['\"\\d\\w]+\\s*=\\s*['\"\\d\\w]+)|" +
            "(\\bAND\\b\\s+['\"\\d\\w]+\\s*=\\s*['\"\\d\\w]+)|" +
            "(xp_cmdshell|sp_executesql)" +
            ")"
    );

    // XSS / HTML script tags
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");
    private static final Pattern SCRIPT_PATTERN = Pattern.compile("(?i)(javascript:|vbscript:|onload=|onerror=|onclick=|<script)");

    // Strict Email Pattern (RFC 5322 compatible subset)
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,10}$");

    // Strict Phone Pattern (E.164 compatible 10-15 digits, optional leading +)
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[0-9]{10,15}$");

    // Strict Safe Text Pattern: Alpha-numeric, spaces, common harmless punctuation
    private static final Pattern SAFE_TEXT_PATTERN = Pattern.compile("^[a-zA-Z0-9\\s.,!?'\"()#&@:;\\-_/+=]*$");

    /**
     * Checks if a string contains any SQL injection signatures.
     * @return true if safe, false if potential SQL injection detected
     */
    public static boolean isSqlSafe(String input) {
        if (input == null || input.isBlank()) {
            return true;
        }
        return !SQL_INJECTION_PATTERN.matcher(input).find();
    }

    /**
     * Checks if a string contains any XSS / script signatures.
     * @return true if safe, false if potential XSS detected
     */
    public static boolean isXssSafe(String input) {
        if (input == null || input.isBlank()) {
            return true;
        }
        return !HTML_TAG_PATTERN.matcher(input).find() && !SCRIPT_PATTERN.matcher(input).find();
    }

    /**
     * Validates if a text contains only acceptable characters and no SQLi/XSS.
     */
    public static boolean isSafeText(String input) {
        if (input == null || input.isBlank()) {
            return true;
        }
        return SAFE_TEXT_PATTERN.matcher(input).matches() && isSqlSafe(input) && isXssSafe(input);
    }

    /**
     * Validates email format strictly.
     */
    public static boolean isValidEmail(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return EMAIL_PATTERN.matcher(email.trim()).matches() && email.length() <= 100 && isSqlSafe(email);
    }

    /**
     * Validates phone format strictly.
     */
    public static boolean isValidPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return false;
        }
        String cleaned = phone.replaceAll("[\\s()-]", "");
        return PHONE_PATTERN.matcher(cleaned).matches() && cleaned.length() <= 16 && isSqlSafe(cleaned);
    }

    /**
     * Sanitizes general text input:
     * - Trims leading and trailing whitespace
     * - Removes harmful HTML tags
     * - Removes null bytes and control characters
     */
    public static String sanitize(String input) {
        if (input == null) {
            return null;
        }
        // Remove null bytes and non-printable control chars (except newline and tab)
        String cleaned = input.replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]", "");
        // Strip HTML tags
        cleaned = HTML_TAG_PATTERN.matcher(cleaned).replaceAll("");
        // Trim whitespace
        return cleaned.trim();
    }
}
