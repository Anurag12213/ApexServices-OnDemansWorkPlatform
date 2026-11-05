package com.apexservices.service.media;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.UUID;

@Service
public class LocalFallbackMediaStorageService implements MediaStorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalFallbackMediaStorageService.class);
    private static final String FALLBACK_DIR = "uploads/media";

    @Override
    public boolean isCloudStorageConfigured() {
        return false;
    }

    @Override
    public String uploadImage(InputStream inputStream, String fileName, String contentType, String folder) {
        try {
            Path targetDir = Paths.get(FALLBACK_DIR, folder != null ? folder : "general");
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }
            String safeName = UUID.randomUUID().toString().substring(0, 8) + "_" + (fileName != null ? fileName : "image.jpg");
            Path targetPath = targetDir.resolve(safeName);
            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
            String url = "/api/public/media/" + (folder != null ? folder + "/" : "") + safeName;
            log.info("Saved image to local fallback storage: {}", url);
            return url;
        } catch (Exception e) {
            log.error("Local fallback upload failed: {}", e.getMessage());
            return "/placeholder.svg";
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
        if (base64DataUri.startsWith("http://") || base64DataUri.startsWith("https://")) {
            return base64DataUri;
        }
        try {
            String base64Data = base64DataUri;
            String ext = "jpg";
            if (base64DataUri.contains(";base64,")) {
                String[] parts = base64DataUri.split(";base64,");
                base64Data = parts[1];
                if (parts[0].contains("png")) ext = "png";
                else if (parts[0].contains("webp")) ext = "webp";
            }
            byte[] bytes = Base64.getDecoder().decode(base64Data.trim());
            String fileName = (publicIdPrefix != null ? publicIdPrefix : "migrated") + "_" + UUID.randomUUID().toString().substring(0, 8) + "." + ext;
            return uploadImage(bytes, fileName, "image/" + ext, folder);
        } catch (Exception e) {
            log.warn("Fallback Base64 processing failed: {}", e.getMessage());
            return base64DataUri;
        }
    }

    @Override
    public boolean deleteImage(String publicUrlOrId) {
        try {
            if (publicUrlOrId != null && publicUrlOrId.startsWith("/api/public/media/")) {
                String relative = publicUrlOrId.replace("/api/public/media/", "");
                Path p = Paths.get(FALLBACK_DIR, relative);
                return Files.deleteIfExists(p);
            }
        } catch (Exception e) {
            log.warn("Fallback delete failed: {}", e.getMessage());
        }
        return false;
    }
}
