package com.apexservices.dto;

import com.apexservices.model.OtpPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResendEmailOtpRequest {

    @NotBlank(message = "Email address is required")
    @Email(message = "A valid email address must be provided")
    private String email;

    @NotNull(message = "OTP challenge purpose is required")
    private OtpPurpose purpose;

    private String recipientName;
}
