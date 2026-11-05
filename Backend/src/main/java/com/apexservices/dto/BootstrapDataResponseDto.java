package com.apexservices.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BootstrapDataResponseDto {
    private Map<String, Object> announcement;
    private List<Map<String, Object>> heroSlides;
    private Map<String, Object> aiOwnerSection;
    private List<Map<String, Object>> categories;
    private List<Map<String, Object>> reviews;
    private Map<String, Object> siteBranding;
    private Map<String, Object> publicConfig;
    private String version;
    private long timestamp;
}
