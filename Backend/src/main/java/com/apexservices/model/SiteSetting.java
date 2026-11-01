package com.apexservices.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "site_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteSetting {
    @Id
    @Column(name = "setting_key", length = 100, nullable = false)
    private String key;

    @Lob
    @Column(name = "setting_value", columnDefinition = "LONGTEXT")
    private String value;
}
