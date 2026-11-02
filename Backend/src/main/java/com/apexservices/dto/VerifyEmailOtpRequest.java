package com.apexservices.dto;

import com.apexservices.model.OtpPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyEmailOtpRequest {

    @NotBlank(message = "Email address is required")
    @Email(message = "A valid email address must be provided")
    private String email;

    @NotNull(message = "OTP challenge purpose is required")
    private OtpPurpose purpose;

    @NotBlank(message = "OTP verification code is required")
    @Pattern(regexp = "^\\d{6}$", message = "Verification code must be exactly 6 numeric digits")
    private String otp;
}
