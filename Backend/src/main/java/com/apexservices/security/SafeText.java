package com.apexservices.security;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = SafeTextValidator.class)
@Target({ElementType.METHOD, ElementType.FIELD, ElementType.ANNOTATION_TYPE, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface SafeText {

    String message() default "Input contains forbidden characters or dangerous SQL injection / script patterns";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    boolean allowEmpty() default true;
}
