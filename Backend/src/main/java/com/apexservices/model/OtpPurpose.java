package com.apexservices.model;

/**
 * Enumeration of supported OTP challenge purposes.
 * Enforces strict cryptographic and business isolation between distinct user lifecycle actions.
 */
public enum OtpPurpose {
    REGISTRATION("Account Registration"),
    PASSWORD_RESET("Password Recovery"),
    LOGIN("Secure Sign-In"),
    EMAIL_CHANGE("Email Address Update");

    private final String description;

    OtpPurpose(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
