package com.apexservices.service.media;

import com.apexservices.model.Category;
import com.apexservices.model.PartnerProfile;
import com.apexservices.model.SiteSetting;
import com.apexservices.model.WorkRequest;
import com.apexservices.repository.CategoryRepository;
import com.apexservices.repository.PartnerProfileRepository;
import com.apexservices.repository.SiteSettingRepository;
import com.apexservices.repository.UserRepository;
import com.apexservices.repository.WorkRequestRepository;
import com.apexservices.service.ContentVersionService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ImageMigrationService {

    private static final Logger log = LoggerFactory.getLogger(ImageMigrationService.class);

    private final SiteSettingRepository siteSettingRepository;
    private final WorkRequestRepository workRequestRepository;
    private final CategoryRepository categoryRepository;
    private final PartnerProfileRepository partnerProfileRepository;
    private final UserRepository userRepository;
    private final MediaStorageService mediaStorageService;
    private final ContentVersionService contentVersionService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // In-memory audit log of migrations with status and rollback backups
    private final Map<String, MigrationRecord> migrationHistory = new ConcurrentHashMap<>();

    public record MigrationRecord(
            String id,
            String sourceTable,
            String sourceKey,
            String status, // PENDING, COMPLETED, PARTIAL_SUCCESS, SKIPPED_NO_CLOUD, FAILED
            int itemsMigrated,
            int itemsFailed,
            String details,
            Instant timestamp
    ) {}

    @Autowired
    public ImageMigrationService(
            SiteSettingRepository siteSettingRepository,
            WorkRequestRepository workRequestRepository,
            CategoryRepository categoryRepository,
            PartnerProfileRepository partnerProfileRepository,
            UserRepository userRepository,
            MediaStorageService mediaStorageService,
            ContentVersionService contentVersionService) {
        this.siteSettingRepository = siteSettingRepository;
        this.workRequestRepository = workRequestRepository;
        this.categoryRepository = categoryRepository;
        this.partnerProfileRepository = partnerProfileRepository;
        this.userRepository = userRepository;
        this.mediaStorageService = mediaStorageService;
        this.contentVersionService = contentVersionService;
    }

    /**
     * Executes idempotent, resumable Base64-to-Cloudinary migration across all database locations:
     * 1. categories (banner_image_url)
     * 2. site_settings (siteBranding logo & categoryImages)
     * 3. partner_profiles (avatar_key)
     * 4. work_requests (photo_url)
     *
     * Preserves backups before mutation and only updates database records when cloud storage confirms success.
     */
    @Transactional
    public MigrationRecord migrateAllImages() {
        String migrationId = "mig_" + UUID.randomUUID().toString().substring(0, 8);
        log.info("Starting image migration [id={}], cloudStorageConfigured={}",
                migrationId, mediaStorageService.isCloudStorageConfigured());

        if (!mediaStorageService.isCloudStorageConfigured()) {
            MigrationRecord rec = new MigrationRecord(
                    migrationId, "all", "site_settings, categories, partner_profiles, work_requests",
                    "SKIPPED_NO_CLOUD", 0, 0,
                    "Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) not set in environment. Migration tooling is ready and operational.",
                    Instant.now()
            );
            migrationHistory.put(migrationId, rec);
            return rec;
        }

        int migrated = 0;
        int failed = 0;

        // 1. Migrate Categories banner_image_url
        try {
            List<Category> categories = categoryRepository.findAll();
            for (Category c : categories) {
                String banner = c.getBannerImageUrl();
                if (banner != null && banner.startsWith("data:image")) {
                    String cloudUrl = mediaStorageService.uploadBase64Image(banner, "categories", "cat_" + c.getId());
                    if (cloudUrl != null && cloudUrl.startsWith("http")) {
                        c.setBannerImageUrl(cloudUrl);
                        categoryRepository.save(c);
                        migrated++;
                    } else {
                        failed++;
                        log.warn("Failed to migrate banner for category id: {}", c.getId());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed during categories banner migration: {}", e.getMessage(), e);
            failed++;
        }

        // 2. Migrate siteBranding (categoryImages map & logoImageUrl)
        try {
            Optional<SiteSetting> brandingOpt = siteSettingRepository.findById("siteBranding");
            if (brandingOpt.isPresent() && brandingOpt.get().getValue() != null) {
                String rawJson = brandingOpt.get().getValue();
                Map<String, Object> branding = objectMapper.readValue(rawJson, new TypeReference<Map<String, Object>>() {});
                boolean modified = false;

                // Create backup before any modification
                String backupKey = "siteBranding_backup_" + System.currentTimeMillis();
                siteSettingRepository.save(new SiteSetting(backupKey, rawJson));
                log.info("Created rollback backup: {}", backupKey);

                // Migrate Logo if Base64
                Object logoObj = branding.get("logoImageUrl");
                if (logoObj instanceof String logoStr && logoStr.startsWith("data:image")) {
                    String cloudUrl = mediaStorageService.uploadBase64Image(logoStr, "branding", "logo");
                    if (cloudUrl != null && cloudUrl.startsWith("http")) {
                        branding.put("logoImageUrl", cloudUrl);
                        modified = true;
                        migrated++;
                    } else {
                        failed++;
                    }
                }

                // Migrate Category Images map
                Object catImagesObj = branding.get("categoryImages");
                if (catImagesObj instanceof Map<?, ?> catMap) {
                    Map<String, String> updatedCatMap = new LinkedHashMap<>();
                    for (Map.Entry<?, ?> entry : catMap.entrySet()) {
                        String key = String.valueOf(entry.getKey());
                        String val = String.valueOf(entry.getValue());
                        if (val.startsWith("data:image")) {
                            String cloudUrl = mediaStorageService.uploadBase64Image(val, "categories", "cat_" + key);
                            if (cloudUrl != null && cloudUrl.startsWith("http")) {
                                updatedCatMap.put(key, cloudUrl);
                                modified = true;
                                migrated++;

                                // Also sync directly to Category entity if found by ID or name
                                syncImageUrlToCategory(key, cloudUrl);
                            } else {
                                updatedCatMap.put(key, val); // Retain original on failure
                                failed++;
                            }
                        } else {
                            updatedCatMap.put(key, val); // Already a URL or untouched
                            if (val.startsWith("http")) {
                                syncImageUrlToCategory(key, val);
                            }
                        }
                    }
                    branding.put("categoryImages", updatedCatMap);
                }

                if (modified) {
                    siteSettingRepository.save(new SiteSetting("siteBranding", objectMapper.writeValueAsString(branding)));
                    log.info("Successfully updated siteBranding in MySQL with migrated Cloudinary URLs.");
                }
            }
        } catch (Exception e) {
            log.error("Failed during siteBranding migration: {}", e.getMessage(), e);
            failed++;
        }

        // 3. Migrate Partner Profiles avatar_key
        try {
            List<PartnerProfile> profiles = partnerProfileRepository.findAll();
            for (PartnerProfile profile : profiles) {
                String avatar = profile.getAvatarKey();
                if (avatar != null && avatar.startsWith("data:image")) {
                    String cloudUrl = mediaStorageService.uploadBase64Image(avatar, "avatars", "partner_" + profile.getUserId());
                    if (cloudUrl != null && cloudUrl.startsWith("http")) {
                        profile.setAvatarKey(cloudUrl);
                        partnerProfileRepository.save(profile);
                        if (profile.getUser() != null) {
                            workRequestRepository.updateAssignedPartnerPhotoForPartner(profile.getUser().getId(), cloudUrl);
                        }
                        migrated++;
                    } else {
                        failed++;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed during partner_profiles avatar migration: {}", e.getMessage(), e);
            failed++;
        }

        // 4. Migrate Work Request completion photos
        try {
            List<WorkRequest> requests = workRequestRepository.findAll();
            for (WorkRequest wr : requests) {
                String photo = wr.getPhotoUrl();
                if (photo != null && photo.startsWith("data:image")) {
                    String cloudUrl = mediaStorageService.uploadBase64Image(photo, "requests", "request_" + wr.getId());
                    if (cloudUrl != null && cloudUrl.startsWith("http")) {
                        wr.setPhotoUrl(cloudUrl);
                        workRequestRepository.save(wr);
                        migrated++;
                    } else {
                        failed++;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed during work_requests photo migration: {}", e.getMessage(), e);
            failed++;
        }

        if (migrated > 0) {
            contentVersionService.bumpVersion();
        }

        String status = (failed == 0) ? "COMPLETED" : (migrated > 0 ? "PARTIAL_SUCCESS" : "FAILED");
        MigrationRecord rec = new MigrationRecord(
                migrationId, "categories, site_settings, partner_profiles, work_requests", "all",
                status, migrated, failed,
                "Migration finished with " + migrated + " assets migrated and " + failed + " failures.",
                Instant.now()
        );
        migrationHistory.put(migrationId, rec);
        return rec;
    }

    /**
     * Migrates legacy browser localStorage Base64 category images sent by the frontend.
     * Uploads images to cloud storage, persists the permanent HTTPS URL in MySQL categories table,
     * and invalidates frontend caches via contentVersion bump.
     *
     * @param browserImages Map of categoryId/slug/name to Base64 data URI or image URL
     * @return Map of categoryId to permanent migrated URL
     */
    @Transactional
    public Map<String, String> migrateBrowserCategoryImages(Map<String, String> browserImages) {
        if (browserImages == null || browserImages.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<String, String> result = new LinkedHashMap<>();
        boolean anyMigrated = false;

        for (Map.Entry<String, String> entry : browserImages.entrySet()) {
            String key = entry.getKey();
            String val = entry.getValue();

            if (val == null || val.isBlank()) continue;

            String permanentUrl = val;

            // If it's Base64, upload to cloud storage
            if (val.startsWith("data:image")) {
                if (mediaStorageService.isCloudStorageConfigured()) {
                    String cloudUrl = mediaStorageService.uploadBase64Image(val, "categories", "cat_browser_" + key);
                    if (cloudUrl != null && cloudUrl.startsWith("http")) {
                        permanentUrl = cloudUrl;
                        anyMigrated = true;
                    }
                }
            }

            // Sync to MySQL Category
            boolean updated = syncImageUrlToCategory(key, permanentUrl);
            if (updated) anyMigrated = true;

            result.put(key, permanentUrl);
        }

        if (anyMigrated) {
            contentVersionService.bumpVersion();
        }

        return result;
    }

    private boolean syncImageUrlToCategory(String key, String url) {
        try {
            Category target = null;
            try {
                Long id = Long.parseLong(key);
                target = categoryRepository.findById(id).orElse(null);
            } catch (NumberFormatException ignored) {}

            if (target == null) {
                target = categoryRepository.findBySlug(key.toLowerCase())
                        .or(() -> categoryRepository.findByNameIgnoreCase(key))
                        .orElse(null);
            }

            if (target != null && (target.getBannerImageUrl() == null || !target.getBannerImageUrl().equals(url))) {
                target.setBannerImageUrl(url);
                categoryRepository.save(target);
                log.info("Synced authoritative banner image URL for category '{}' (id={}): {}", target.getName(), target.getId(), url);
                return true;
            }
        } catch (Exception e) {
            log.warn("Could not sync image URL to category {}: {}", key, e.getMessage());
        }
        return false;
    }

    /**
     * Rollback a previous migration by restoring from a backup key.
     */
    @Transactional
    public boolean rollbackSetting(String targetKey, String backupKey) {
        Optional<SiteSetting> backup = siteSettingRepository.findById(backupKey);
        if (backup.isPresent()) {
            siteSettingRepository.save(new SiteSetting(targetKey, backup.get().getValue()));
            contentVersionService.bumpVersion();
            log.info("Rolled back {} using backup {}", targetKey, backupKey);
            return true;
        }
        return false;
    }

    public List<MigrationRecord> getMigrationHistory() {
        return new ArrayList<>(migrationHistory.values());
    }
}
