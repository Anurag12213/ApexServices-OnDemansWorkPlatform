package com.apexservices.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OtpApiResponse {

    private boolean success;
    private String message;
    private Integer cooldownSeconds;
    private Integer expiresInSeconds;
    private String verificationGrant;

    public static OtpApiResponse success(String message) {
        return OtpApiResponse.builder()
                .success(true)
                .message(message)
                .build();
    }

    public static OtpApiResponse challengeDispatched(String message, int cooldownSeconds, int expiresInSeconds) {
        return OtpApiResponse.builder()
                .success(true)
                .message(message)
                .cooldownSeconds(cooldownSeconds)
                .expiresInSeconds(expiresInSeconds)
                .build();
    }

    public static OtpApiResponse verified(String message, String verificationGrant, int grantExpiresInSeconds) {
        return OtpApiResponse.builder()
                .success(true)
                .message(message)
                .verificationGrant(verificationGrant)
                .expiresInSeconds(grantExpiresInSeconds)
                .build();
    }
}
