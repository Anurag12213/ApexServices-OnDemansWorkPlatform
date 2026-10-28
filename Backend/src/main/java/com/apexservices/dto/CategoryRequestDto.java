package com.apexservices.dto;

import com.apexservices.security.SafeText;
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
public class CategoryRequestDto {

    @NotBlank(message = "Category name is required")
    @Size(min = 2, max = 100, message = "Category name must be between 2 and 100 characters")
    @SafeText(message = "Category name contains invalid or dangerous characters")
    private String name;

    @Size(max = 100, message = "Slug cannot exceed 100 characters")
    @SafeText(message = "Slug contains invalid characters")
    private String slug;

    private Boolean active;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    @SafeText(message = "Description contains invalid or dangerous characters")
    private String description;

    @Size(max = 50, message = "Tag cannot exceed 50 characters")
    @SafeText(message = "Tag contains invalid or dangerous characters")
    private String tag;

    private Long iconId;

    @Size(max = 100, message = "Icon name cannot exceed 100 characters")
    @SafeText(message = "Icon name contains invalid characters")
    private String iconName;

    @Size(max = 100, message = "Custom icon name cannot exceed 100 characters")
    @SafeText(message = "Custom icon name contains invalid characters")
    private String customIconName;

    @Size(max = 50000, message = "Custom icon payload exceeds permitted size")
    private String customIconValue;
}
