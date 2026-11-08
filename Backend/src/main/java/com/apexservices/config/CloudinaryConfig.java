package com.apexservices.config;
import com.apexservices.service.media.MediaStorageService;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryConfig.class);

    @Value("${CLOUDINARY_URL:${cloudinary.url:}}")
    private String cloudinaryUrl;

    @Value("${CLOUDINARY_CLOUD_NAME:${cloudinary.cloud-name:}}")
    private String cloudName;

    @Value("${CLOUDINARY_API_KEY:${cloudinary.api-key:}}")
    private String apiKey;

    @Value("${CLOUDINARY_API_SECRET:${cloudinary.api-secret:}}")
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {
        if (cloudinaryUrl != null && !cloudinaryUrl.isBlank() && cloudinaryUrl.startsWith("cloudinary://")) {
            log.info("Initializing Cloudinary Media Provider via CLOUDINARY_URL");
            return new Cloudinary(cloudinaryUrl.trim());
        }
        if (cloudName != null && !cloudName.isBlank() &&
            apiKey != null && !apiKey.isBlank() &&
            apiSecret != null && !apiSecret.isBlank()) {
            log.info("Initializing Cloudinary Media Provider for cloud: {}", cloudName);
            return new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName.trim(),
                    "api_key", apiKey.trim(),
                    "api_secret", apiSecret.trim(),
                    "secure", true
            ));
        }
        log.warn("Cloudinary credentials not detected in environment. MediaStorageService will utilize fallback storage.");
        return null;
    }
}
