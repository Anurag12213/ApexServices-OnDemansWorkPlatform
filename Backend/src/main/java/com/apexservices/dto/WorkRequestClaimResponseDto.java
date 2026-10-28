package com.apexservices.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkRequestClaimResponseDto {

    private boolean success;
    private String message;
    private String errorCode;
    private WorkRequestResponseDto request;

    public static WorkRequestClaimResponseDto success(WorkRequestResponseDto req) {
        return WorkRequestClaimResponseDto.builder()
                .success(true)
                .message("Work request claimed successfully.")
                .request(req)
                .build();
    }

    public static WorkRequestClaimResponseDto conflict(String errorCode, String message) {
        return WorkRequestClaimResponseDto.builder()
                .success(false)
                .errorCode(errorCode)
                .message(message)
                .build();
    }
}
