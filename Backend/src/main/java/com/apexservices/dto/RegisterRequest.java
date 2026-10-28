package com.apexservices.dto;

import com.apexservices.model.Role;
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
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    @Pattern(
        regexp = "^[a-zA-Z0-9\\s.'-]{2,100}$",
        message = "Full name can only contain letters, digits, spaces, dots, and hyphens"
    )
    private String fullName;

    @Size(max = 100, message = "Email cannot exceed 100 characters")
    @Pattern(
        regexp = "^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,10}$",
        message = "Invalid email address format"
    )
    private String email;

    @Size(max = 20, message = "Mobile number cannot exceed 20 characters")
    @Pattern(
        regexp = "^$|^\\+?[0-9]{10,15}$",
        message = "Mobile number must be between 10 and 15 digits"
    )
    private String mobileNumber;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
    private String password;

    private Role role;

    public void setFullName(String fullName) {
        this.fullName = fullName != null ? fullName.trim() : null;
    }

    public void setEmail(String email) {
        this.email = email != null && !email.isBlank() ? email.trim().toLowerCase() : null;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber != null && !mobileNumber.isBlank() ? mobileNumber.trim() : null;
    }

    public void setPhone(String phone) {
        if (this.mobileNumber == null || this.mobileNumber.isBlank()) {
            this.mobileNumber = phone != null && !phone.isBlank() ? phone.trim() : null;
        }
    }
}
