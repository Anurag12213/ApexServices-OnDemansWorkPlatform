package com.apexservices.service;

import com.apexservices.model.Category;
import com.apexservices.model.SiteSetting;
import com.apexservices.repository.CategoryRepository;
import com.apexservices.repository.PartnerProfileRepository;
import com.apexservices.repository.SiteSettingRepository;
import com.apexservices.repository.UserRepository;
import com.apexservices.repository.WorkRequestRepository;
import com.apexservices.service.media.ImageMigrationService;
import com.apexservices.service.media.MediaStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Tests - ImageMigrationService Idempotency & Resumability")
class ImageMigrationServiceTest {

    @Mock
    private SiteSettingRepository siteSettingRepository;

    @Mock
    private WorkRequestRepository workRequestRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private PartnerProfileRepository partnerProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MediaStorageService mediaStorageService;

    @Mock
    private ContentVersionService contentVersionService;

    private ImageMigrationService migrationService;

    @BeforeEach
    void setUp() {
        migrationService = new ImageMigrationService(
                siteSettingRepository,
                workRequestRepository,
                categoryRepository,
                partnerProfileRepository,
                userRepository,
                mediaStorageService,
                contentVersionService
        );
    }

    @Test
    @DisplayName("Migration safely skips when Cloudinary is not configured")
    void testMigrationSkippedWithoutCloudinary() {
        when(mediaStorageService.isCloudStorageConfigured()).thenReturn(false);

        ImageMigrationService.MigrationRecord record = migrationService.migrateAllImages();

        assertEquals("SKIPPED_NO_CLOUD", record.status());
        assertEquals(0, record.itemsMigrated());
        verifyNoInteractions(categoryRepository);
    }

    @Test
    @DisplayName("Migration converts Base64 category banner to Cloudinary URL and bumps version")
    void testCategoryBannerMigration() {
        when(mediaStorageService.isCloudStorageConfigured()).thenReturn(true);

        Category cat = Category.builder()
                .id(101L)
                .name("Plumbing")
                .slug("plumbing")
                .bannerImageUrl("data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==")
                .build();

        when(categoryRepository.findAll()).thenReturn(List.of(cat));
        when(mediaStorageService.uploadBase64Image(eq("data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=="), eq("categories"), anyString()))
                .thenReturn("https://res.cloudinary.com/apexservices/plumbing.webp");
        when(siteSettingRepository.findById(anyString())).thenReturn(Optional.empty());
        when(partnerProfileRepository.findAll()).thenReturn(Collections.emptyList());
        when(workRequestRepository.findAll()).thenReturn(Collections.emptyList());

        ImageMigrationService.MigrationRecord record = migrationService.migrateAllImages();

        assertEquals("COMPLETED", record.status());
        assertTrue(record.itemsMigrated() >= 1);
        assertEquals("https://res.cloudinary.com/apexservices/plumbing.webp", cat.getBannerImageUrl());
        verify(categoryRepository, times(1)).save(cat);
        verify(contentVersionService, atLeastOnce()).bumpVersion();
    }

    @Test
    @DisplayName("Existing HTTP/HTTPS URLs are untouched during migration (idempotent)")
    void testIdempotencyForHttpUrls() {
        when(mediaStorageService.isCloudStorageConfigured()).thenReturn(true);

        Category cat = Category.builder()
                .id(102L)
                .name("Electrical")
                .slug("electrical")
                .bannerImageUrl("https://res.cloudinary.com/apexservices/electrical.webp")
                .build();

        when(categoryRepository.findAll()).thenReturn(List.of(cat));
        when(siteSettingRepository.findById(anyString())).thenReturn(Optional.empty());
        when(partnerProfileRepository.findAll()).thenReturn(Collections.emptyList());
        when(workRequestRepository.findAll()).thenReturn(Collections.emptyList());

        ImageMigrationService.MigrationRecord record = migrationService.migrateAllImages();

        assertEquals("COMPLETED", record.status());
        assertEquals(0, record.itemsMigrated()); // None needed migration
        verify(categoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Browser-local Base64 migration uploads to Cloud and updates MySQL category")
    void testBrowserLocalImageMigration() {
        when(mediaStorageService.isCloudStorageConfigured()).thenReturn(true);
        when(mediaStorageService.uploadBase64Image(anyString(), eq("categories"), anyString()))
                .thenReturn("https://res.cloudinary.com/apexservices/browser_migrated.webp");

        Category cat = Category.builder()
                .id(50L)
                .name("Carpentry")
                .slug("carpentry")
                .build();

        when(categoryRepository.findById(50L)).thenReturn(Optional.of(cat));

        Map<String, String> result = migrationService.migrateBrowserCategoryImages(
                Map.of("50", "data:image/jpeg;base64,abc123xyz")
        );

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("https://res.cloudinary.com/apexservices/browser_migrated.webp", result.get("50"));
        assertEquals("https://res.cloudinary.com/apexservices/browser_migrated.webp", cat.getBannerImageUrl());
        verify(categoryRepository, times(1)).save(cat);
        verify(contentVersionService, times(1)).bumpVersion();
    }
}
