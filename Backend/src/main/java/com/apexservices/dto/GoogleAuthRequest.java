package com.apexservices.dto;

import com.apexservices.model.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleAuthRequest {

    @NotBlank(message = "Google ID token is required")
    @Size(max = 4096, message = "Google ID token exceeds permitted length")
    private String idToken;

    private Role role;
}
