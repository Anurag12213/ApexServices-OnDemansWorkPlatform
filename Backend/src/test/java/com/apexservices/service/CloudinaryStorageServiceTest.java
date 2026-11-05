package com.apexservices.service;

import com.apexservices.service.media.CloudinaryStorageService;
import com.apexservices.service.media.LocalFallbackMediaStorageService;
import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Tests - CloudinaryStorageService Production Hardening")
class CloudinaryStorageServiceTest {

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    @Mock
    private LocalFallbackMediaStorageService fallbackStorage;

    private CloudinaryStorageService serviceWithCloudinary;
    private CloudinaryStorageService serviceWithoutCloudinary;

    @BeforeEach
    void setUp() {
        serviceWithCloudinary = new CloudinaryStorageService(cloudinary, fallbackStorage);
        serviceWithoutCloudinary = new CloudinaryStorageService(null, fallbackStorage);
    }

    @Test
    @DisplayName("In production (allowLocalFallback=false), missing Cloudinary throws IllegalStateException")
    void testMissingCloudinaryThrowsInProduction() {
        serviceWithoutCloudinary.setAllowLocalFallback(false);

        ByteArrayInputStream stream = new ByteArrayInputStream("image-bytes".getBytes(StandardCharsets.UTF_8));
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                serviceWithoutCloudinary.uploadImage(stream, "test.png", "image/png", "categories")
        );

        assertTrue(ex.getMessage().contains("Permanent cloud media storage"));
        verifyNoInteractions(fallbackStorage);
    }

    @Test
    @DisplayName("In dev/test (allowLocalFallback=true), missing Cloudinary falls back to local disk")
    void testMissingCloudinaryFallsBackInDev() {
        serviceWithoutCloudinary.setAllowLocalFallback(true);
        when(fallbackStorage.uploadImage(any(java.io.InputStream.class), eq("test.png"), eq("image/png"), eq("categories")))
                .thenReturn("http://localhost:8080/uploads/categories/test.png");

        ByteArrayInputStream stream = new ByteArrayInputStream("image-bytes".getBytes(StandardCharsets.UTF_8));
        String result = serviceWithoutCloudinary.uploadImage(stream, "test.png", "image/png", "categories");

        assertEquals("http://localhost:8080/uploads/categories/test.png", result);
        verify(fallbackStorage, times(1)).uploadImage(any(java.io.InputStream.class), eq("test.png"), eq("image/png"), eq("categories"));
    }

    @Test
    @DisplayName("In production (allowLocalFallback=false), failed Cloudinary upload throws IllegalStateException")
    void testFailedCloudinaryUploadThrowsInProduction() throws Exception {
        serviceWithCloudinary.setAllowLocalFallback(false);
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), any(Map.class))).thenThrow(new IOException("Cloudinary timeout"));

        ByteArrayInputStream stream = new ByteArrayInputStream("image-bytes".getBytes(StandardCharsets.UTF_8));
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                serviceWithCloudinary.uploadImage(stream, "test.png", "image/png", "categories")
        );

        assertTrue(ex.getMessage().contains("Failed to upload image to permanent cloud storage"));
        verifyNoInteractions(fallbackStorage);
    }

    @Test
    @DisplayName("uploadBase64Image returns existing HTTP/HTTPS URL immediately (idempotent)")
    void testHttpUrlIdempotency() {
        String existingUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
        String result = serviceWithCloudinary.uploadBase64Image(existingUrl, "categories", "cat_1");

        assertEquals(existingUrl, result);
        verifyNoInteractions(cloudinary);
        verifyNoInteractions(fallbackStorage);
    }

    @Test
    @DisplayName("Successful Cloudinary upload returns secure_url")
    void testSuccessfulCloudinaryUpload() throws Exception {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), any(Map.class))).thenReturn(Map.of("secure_url", "https://res.cloudinary.com/apex/image.webp"));

        ByteArrayInputStream stream = new ByteArrayInputStream("image-bytes".getBytes(StandardCharsets.UTF_8));
        String result = serviceWithCloudinary.uploadImage(stream, "test.png", "image/png", "categories");

        assertEquals("https://res.cloudinary.com/apex/image.webp", result);
    }
}
