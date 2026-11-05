package com.apexservices.controller;

import com.apexservices.service.media.ImageMigrationService;
import com.apexservices.service.media.MediaStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MediaMigrationController {

    private final ImageMigrationService imageMigrationService;
    private final MediaStorageService mediaStorageService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/media/migrate")
    public ResponseEntity<ImageMigrationService.MigrationRecord> triggerMigration() {
        ImageMigrationService.MigrationRecord result = imageMigrationService.migrateAllImages();
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/media/migration-history")
    public ResponseEntity<List<ImageMigrationService.MigrationRecord>> getMigrationHistory() {
        return ResponseEntity.ok(imageMigrationService.getMigrationHistory());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/media/rollback")
    public ResponseEntity<Map<String, Object>> rollbackMigration(
            @RequestParam String targetKey,
            @RequestParam String backupKey) {
        boolean success = imageMigrationService.rollbackSetting(targetKey, backupKey);
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", success);
        res.put("targetKey", targetKey);
        res.put("backupKey", backupKey);
        return ResponseEntity.ok(res);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/media/migrate-browser-images")
    public ResponseEntity<Map<String, String>> migrateBrowserImages(@RequestBody Map<String, String> localImages) {
        Map<String, String> result = imageMigrationService.migrateBrowserCategoryImages(localImages);
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PARTNER')")
    @PostMapping("/media/upload")
    public ResponseEntity<Map<String, Object>> uploadMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "general") String folder) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File cannot be empty"));
        }
        try {
            String url = mediaStorageService.uploadImage(
                    file.getInputStream(),
                    file.getOriginalFilename(),
                    file.getContentType(),
                    folder
            );
            Map<String, Object> res = new LinkedHashMap<>();
            res.put("success", true);
            res.put("url", url);
            res.put("isCloudinary", mediaStorageService.isCloudStorageConfigured());
            return ResponseEntity.ok(res);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }
}
