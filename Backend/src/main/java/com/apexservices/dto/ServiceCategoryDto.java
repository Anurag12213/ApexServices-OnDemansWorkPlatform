package com.apexservices.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCategoryDto {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String tag;
    private boolean active;
    @com.fasterxml.jackson.annotation.JsonProperty("isSoftDeleted")
    private boolean isSoftDeleted;
    private Long iconId;
    private String iconName;
    private long partnerCount;
    private long requestCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
