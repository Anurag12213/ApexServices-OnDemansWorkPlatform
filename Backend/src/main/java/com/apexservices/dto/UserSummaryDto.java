package com.apexservices.dto;

import com.apexservices.model.AuthProvider;
import com.apexservices.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDto {
    private Long id;
    private String fullName;
    private String email;
    private String mobileNumber;
    private Role role;
    private AuthProvider provider;
    private String partnerType;
    private String organizationName;
    private java.util.List<String> serviceCategories;
}
