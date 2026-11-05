package com.apexservices.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryPublicDto {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String tag;
    private boolean active;
    private boolean isSoftDeleted;
    private Long iconId;
    private String iconName;
    private String iconType;
    private String iconValue;
    private String bannerImageUrl;
}
