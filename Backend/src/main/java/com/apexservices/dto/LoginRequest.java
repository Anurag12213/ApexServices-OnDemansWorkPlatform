package com.apexservices.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Email or mobile number is required")
    @Size(max = 100, message = "Email or mobile number cannot exceed 100 characters")
    @Pattern(
        regexp = "^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,10}|\\+?[0-9]{10,15})$",
        message = "Identifier must be a valid email address or 10-15 digit mobile number"
    )
    private String identifier;

    @NotBlank(message = "Password is required")
    @Size(max = 72, message = "Password cannot exceed 72 characters")
    private String password;

    public void setUsername(String username) {
        if (this.identifier == null || this.identifier.isBlank()) {
            this.identifier = username != null ? username.trim() : null;
        }
    }

    public void setEmail(String email) {
        if (this.identifier == null || this.identifier.isBlank()) {
            this.identifier = email != null ? email.trim() : null;
        }
    }

    public void setMobileNumber(String mobileNumber) {
        if (this.identifier == null || this.identifier.isBlank()) {
            this.identifier = mobileNumber != null ? mobileNumber.trim() : null;
        }
    }

    public void setPhone(String phone) {
        if (this.identifier == null || this.identifier.isBlank()) {
            this.identifier = phone != null ? phone.trim() : null;
        }
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier != null ? identifier.trim() : null;
    }
}
