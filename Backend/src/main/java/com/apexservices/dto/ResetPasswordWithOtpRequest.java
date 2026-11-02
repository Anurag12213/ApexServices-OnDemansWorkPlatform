package com.apexservices.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResetPasswordWithOtpRequest {

    @NotBlank(message = "Email address is required")
    @Email(message = "A valid email address must be provided")
    private String email;

    @NotBlank(message = "Verification grant is required")
    private String verificationGrant;

    @NotBlank(message = "New password is required")
    @Size(min = 6, message = "Password must be at least 6 characters in length")
    private String newPassword;
}
