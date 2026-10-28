package com.apexservices.security;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class SafeTextValidator implements ConstraintValidator<SafeText, String> {

    private boolean allowEmpty;

    @Override
    public void initialize(SafeText constraintAnnotation) {
        this.allowEmpty = constraintAnnotation.allowEmpty();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return allowEmpty;
        }

        // 1. Must not contain SQL injection keywords or syntax
        if (!InputSanitizer.isSqlSafe(value)) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Input contains dangerous SQL command keywords or comment markers")
                    .addConstraintViolation();
            return false;
        }

        // 2. Must not contain script / HTML tags
        if (!InputSanitizer.isXssSafe(value)) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Input contains forbidden HTML or script tags")
                    .addConstraintViolation();
            return false;
        }

        // 3. Must match safe character set
        if (!InputSanitizer.isSafeText(value)) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Input contains invalid or unsafe characters")
                    .addConstraintViolation();
            return false;
        }

        return true;
    }
}
