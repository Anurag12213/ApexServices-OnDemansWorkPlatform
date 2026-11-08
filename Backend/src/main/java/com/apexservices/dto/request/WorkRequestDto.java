package com.apexservices.dto.request;

import com.apexservices.security.SafeText;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkRequestDto {

    @Size(max = 50)
    private String id;

    @NotBlank(message = "Service category is required")
    @Size(max = 100, message = "Service category cannot exceed 100 characters")
    @SafeText
    private String serviceCategory;

    private Long serviceCategoryId;

    @NotBlank(message = "Customer name is required")
    @Size(min = 2, max = 100, message = "Customer name must be between 2 and 100 characters")
    @SafeText
    private String customerName;

    @Size(max = 100, message = "Customer email cannot exceed 100 characters")
    @Pattern(
        regexp = "^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,10}$",
        message = "Invalid customer email format"
    )
    private String customerEmail;

    @NotBlank(message = "Contact phone is required")
    @Size(max = 20, message = "Contact phone cannot exceed 20 characters")
    @Pattern(
        regexp = "^\\+?[0-9\\s\\-]{7,20}$",
        message = "Phone number must be between 7 and 20 digits"
    )
    private String contactPhone;

    @NotBlank(message = "Service address is required")
    @Size(max = 500, message = "Address cannot exceed 500 characters")
    @SafeText
    private String serviceAddress;

    private BigDecimal latitude;
    private BigDecimal longitude;

    @Size(max = 200)
    @SafeText
    private String houseDetails;

    @Size(max = 200)
    @SafeText
    private String landmark;

    @Size(max = 100)
    @SafeText
    private String cityPostal;

    @Size(max = 2000, message = "Problem description cannot exceed 2000 characters")
    @SafeText
    private String problemDescription;

    @Size(max = 50)
    @SafeText
    private String urgency;

    @Size(max = 50)
    @SafeText
    private String preferredDate;

    @Size(max = 50)
    @SafeText
    private String preferredTime;

    private Object estimatedCost;

    @Size(max = 50)
    @SafeText
    private String status;

    private Integer stage;

    private String createdAt;

    private Map<String, Object> technicalAnswers;

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone != null ? contactPhone.replaceAll("[\\s\\-\\(\\)]", "") : null;
    }

    public void setPhone(String phone) {
        if (this.contactPhone == null || this.contactPhone.isBlank()) {
            this.contactPhone = phone != null ? phone.replaceAll("[\\s\\-\\(\\)]", "") : null;
        }
    }

    public void setTimeSlot(String timeSlot) {
        if (this.preferredTime == null || this.preferredTime.isBlank()) {
            this.preferredTime = timeSlot;
        }
    }

    public void setAdditionalAnswers(Object additionalAnswers) {
        // Ignored or mapped to technicalAnswers if needed
    }
}
