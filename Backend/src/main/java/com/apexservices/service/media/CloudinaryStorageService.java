package com.apexservices.service.media;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.*;

@Service
@Primary
public class CloudinaryStorageService implements MediaStorageService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryStorageService.class);
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

    private final Cloudinary cloudinary;
    private final LocalFallbackMediaStorageService fallbackStorage;

    @org.springframework.beans.factory.annotation.Value("${media.storage.allow-local-fallback:false}")
    private boolean allowLocalFallback;

    @Autowired
    public CloudinaryStorageService(
            @Autowired(required = false) Cloudinary cloudinary,
            LocalFallbackMediaStorageService fallbackStorage) {
        this.cloudinary = cloudinary;
        this.fallbackStorage = fallbackStorage;
    }

    public void setAllowLocalFallback(boolean allowLocalFallback) {
        this.allowLocalFallback = allowLocalFallback;
    }

    public boolean isAllowLocalFallback() {
        return allowLocalFallback;
    }

    @Override
    public boolean isCloudStorageConfigured() {
        return cloudinary != null;
    }

    @Override
    public String uploadImage(InputStream inputStream, String fileName, String contentType, String folder) {
        if (!isCloudStorageConfigured()) {
            if (allowLocalFallback) {
                log.warn("Cloudinary is not configured. Falling back to local disk storage (allowed in dev/test only).");
                return fallbackStorage.uploadImage(inputStream, fileName, contentType, folder);
            }
            throw new IllegalStateException("Permanent cloud media storage (Cloudinary) is required in production. Ephemeral local storage is disabled to prevent permanent data loss.");
        }

        byte[] bytes;
        try {
            bytes = inputStream.readAllBytes();
            if (bytes.length > MAX_FILE_SIZE) {
                throw new IllegalArgumentException("Image exceeds maximum permitted size of 10MB");
            }

            Map<String, Object> params = ObjectUtils.asMap(
                    "folder", "apexservices/" + (folder != null ? folder : "general"),
                    "resource_type", "image",
                    "format", "webp",
                    "transformation", "q_auto,f_auto"
            );

            Map<?, ?> uploadResult = cloudinary.uploader().upload(bytes, params);
            String secureUrl = (String) uploadResult.get("secure_url");
            log.info("Successfully uploaded image to Cloudinary: {}", secureUrl);
            return secureUrl;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Cloudinary upload failed for file {}: {}", fileName, e.getMessage());
            if (allowLocalFallback) {
                log.warn("Falling back to local storage due to Cloudinary failure (allowed in dev/test only).");
                try {
                    return fallbackStorage.uploadImage(new ByteArrayInputStream(inputStream.readAllBytes()), fileName, contentType, folder);
                } catch (Exception ignored) {
                    return fallbackStorage.uploadImage(new byte[0], fileName, contentType, folder);
                }
            }
            throw new IllegalStateException("Failed to upload image to permanent cloud storage: " + e.getMessage(), e);
        }
    }

    @Override
    public String uploadImage(byte[] imageBytes, String fileName, String contentType, String folder) {
        return uploadImage(new ByteArrayInputStream(imageBytes), fileName, contentType, folder);
    }

    @Override
    public String uploadBase64Image(String base64DataUri, String folder, String publicIdPrefix) {
        if (base64DataUri == null || base64DataUri.isBlank()) {
            return null;
        }

        // If it's already an HTTP / Cloudinary URL, return as-is
        if (base64DataUri.startsWith("http://") || base64DataUri.startsWith("https://")) {
            return base64DataUri;
        }

        try {
            String base64Data = base64DataUri;
            String contentType = "image/jpeg";
            String ext = "jpg";

            if (base64DataUri.contains(";base64,")) {
                String[] parts = base64DataUri.split(";base64,");
                String header = parts[0];
                base64Data = parts[1];
                if (header.contains("image/png")) {
                    contentType = "image/png";
                    ext = "png";
                } else if (header.contains("image/webp")) {
                    contentType = "image/webp";
                    ext = "webp";
                } else if (header.contains("image/svg+xml")) {
                    contentType = "image/svg+xml";
                    ext = "svg";
                }
            }

            byte[] decoded = Base64.getDecoder().decode(base64Data.trim());
            String fileName = (publicIdPrefix != null ? publicIdPrefix : "media") + "_" + UUID.randomUUID().toString().substring(0, 8) + "." + ext;

            if (!isCloudStorageConfigured()) {
                if (allowLocalFallback) {
                    log.warn("Cloudinary not configured. Falling back to local disk Base64 storage (allowed in dev/test only).");
                    return fallbackStorage.uploadImage(decoded, fileName, contentType, folder);
                }
                throw new IllegalStateException("Permanent cloud media storage (Cloudinary) is required in production. Ephemeral local storage is disabled to prevent permanent data loss.");
            }

            Map<String, Object> params = ObjectUtils.asMap(
                    "folder", "apexservices/" + (folder != null ? folder : "migrated"),
                    "resource_type", "image",
                    "public_id", (publicIdPrefix != null ? publicIdPrefix + "_" : "") + UUID.randomUUID().toString().substring(0, 8),
                    "transformation", "q_auto,f_auto"
            );

            Map<?, ?> uploadResult = cloudinary.uploader().upload(decoded, params);
            String secureUrl = (String) uploadResult.get("secure_url");
            log.info("Base64 successfully uploaded to Cloudinary: {}", secureUrl);
            return secureUrl;
        } catch (Exception e) {
            log.error("Failed to decode and upload Base64 image to Cloudinary: {}", e.getMessage());
            // Fallback or return original if unparsable
            return base64DataUri;
        }
    }

    @Override
    public boolean deleteImage(String publicUrlOrId) {
        if (publicUrlOrId == null || !isCloudStorageConfigured()) {
            return false;
        }
        try {
            // Extract public ID from Cloudinary URL if full URL is passed
            String publicId = extractPublicId(publicUrlOrId);
            Map<?, ?> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            return "ok".equalsIgnoreCase((String) result.get("result"));
        } catch (Exception e) {
            log.warn("Cloudinary delete failed for {}: {}", publicUrlOrId, e.getMessage());
            return false;
        }
    }

    private String extractPublicId(String urlOrId) {
        if (!urlOrId.contains("res.cloudinary.com")) {
            return urlOrId;
        }
        try {
            int uploadIndex = urlOrId.indexOf("/upload/");
            if (uploadIndex != -1) {
                String sub = urlOrId.substring(uploadIndex + 8);
                // Skip version tag e.g. v12345678/
                if (sub.matches("^v[0-9]+/.*")) {
                    sub = sub.substring(sub.indexOf('/') + 1);
                }
                // Strip extension
                int dotIndex = sub.lastIndexOf('.');
                if (dotIndex != -1) {
                    sub = sub.substring(0, dotIndex);
                }
                return sub;
            }
        } catch (Exception ignored) {}
        return urlOrId;
    }
}
