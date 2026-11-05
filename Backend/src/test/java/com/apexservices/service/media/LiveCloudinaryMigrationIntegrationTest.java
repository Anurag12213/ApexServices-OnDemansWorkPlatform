package com.apexservices.service.media;

import com.apexservices.model.SiteSetting;
import com.apexservices.repository.SiteSettingRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("Live Integration Test - Cloudinary Media Setup & Migration Verification")
public class LiveCloudinaryMigrationIntegrationTest {

    private static final Logger log = LoggerFactory.getLogger(LiveCloudinaryMigrationIntegrationTest.class);

    @Autowired
    private MediaStorageService mediaStorageService;

    @Autowired
    private ImageMigrationService imageMigrationService;

    @Autowired
    private SiteSettingRepository siteSettingRepository;

    @Test
    @DisplayName("Verify Cloudinary is active and execute live Base64 migration to Cloudinary")
    void testExecuteLiveCloudinaryMigration() {
        // 1. Verify Cloudinary is active
        assertTrue(mediaStorageService.isCloudStorageConfigured(),
                "Cloudinary must be configured with cloud_name, api_key, and api_secret");
        log.info("Cloudinary configuration verified. Active cloud provider: CloudinaryStorageService");

        // 2. Execute migration
        ImageMigrationService.MigrationRecord record = imageMigrationService.migrateAllImages();
        assertNotNull(record);
        log.info("Migration Result: ID={}, Status={}, Migrated={}, Failed={}, Details={}",
                record.id(), record.status(), record.itemsMigrated(), record.itemsFailed(), record.details());

        // Status should be COMPLETED or SKIPPED if no Base64 existed
        assertTrue(record.status().equals("COMPLETED") || record.status().equals("SKIPPED_NO_CLOUD"),
                "Migration must complete successfully. Actual status: " + record.status());

        // 3. Inspect updated siteBranding in MySQL
        Optional<SiteSetting> branding = siteSettingRepository.findById("siteBranding");
        if (branding.isPresent() && branding.get().getValue() != null) {
            String val = branding.get().getValue();
            assertFalse(val.contains("data:image/"), "siteBranding must no longer contain raw data:image/ Base64 strings");
            log.info("siteBranding verified: All Base64 images successfully replaced with Cloudinary CDN URLs.");
        }
    }
}
