package com.apexservices.controller;

import com.apexservices.dto.BootstrapDataResponseDto;
import com.apexservices.repository.SiteSettingRepository;
import com.apexservices.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Tests - ContentDataController Performance, DTO & ETag Optimization")
class ContentDataControllerOptimizationTest {

    @Mock
    private CategoryService categoryService;

    @Mock
    private IconService iconService;

    @Mock
    private WorkRequestService workRequestService;

    @Mock
    private PartnerPresenceService presenceService;

    @Mock
    private ReviewService reviewService;

    @Mock
    private PartnerProfileService partnerProfileService;

    @Mock
    private PlatformConfigService platformConfigService;

    private ContentVersionService contentVersionService;
    private SiteContentService siteContentService;
    private ContentDataController controller;

    @BeforeEach
    void setUp() {
        contentVersionService = new ContentVersionService();
        siteContentService = new SiteContentService(mock(SiteSettingRepository.class), contentVersionService, platformConfigService);
        siteContentService.init();

        lenient().when(categoryService.getCategories()).thenReturn(Collections.emptyList());

        controller = new ContentDataController(
                siteContentService,
                categoryService,
                iconService,
                workRequestService,
                presenceService,
                reviewService,
                partnerProfileService,
                contentVersionService,
                platformConfigService
        );
    }

    @Test
    @DisplayName("GET /api/data returns BootstrapDataResponseDto with ETag and Cache-Control")
    void testGetDataReturnsBootstrapDtoWithEtag() {
        ResponseEntity<BootstrapDataResponseDto> response = controller.getFullData(null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertNotNull(response.getHeaders().getETag());
        assertTrue(response.getHeaders().getETag().startsWith("\"v"));
        assertEquals("public, max-age=60, must-revalidate", response.getHeaders().getCacheControl());

        BootstrapDataResponseDto dto = response.getBody();
        assertNotNull(dto.getAnnouncement());
        assertNotNull(dto.getHeroSlides());
        assertNotNull(dto.getAiOwnerSection());
        assertNotNull(dto.getReviews());
        assertNotNull(dto.getSiteBranding());
    }

    @Test
    @DisplayName("GET /api/data with matching If-None-Match returns HTTP 304 Not Modified")
    void testGetDataReturns304WhenEtagMatches() {
        // First request to obtain ETag
        ResponseEntity<BootstrapDataResponseDto> firstResponse = controller.getFullData(null);
        String etag = firstResponse.getHeaders().getETag();
        assertNotNull(etag);

        // Conditional request with same ETag
        ResponseEntity<BootstrapDataResponseDto> conditionalResponse = controller.getFullData(etag);

        assertEquals(HttpStatus.NOT_MODIFIED, conditionalResponse.getStatusCode());
        assertNull(conditionalResponse.getBody());
        assertEquals(etag, conditionalResponse.getHeaders().getETag());
    }

    @Test
    @DisplayName("GET /api/data returns 200 with new content when version changes")
    void testGetDataInvalidatesCacheOnVersionBump() {
        ResponseEntity<BootstrapDataResponseDto> firstResponse = controller.getFullData(null);
        String initialEtag = firstResponse.getHeaders().getETag();

        // Admin mutates content (triggering bumpContentVersion)
        controller.bumpContentVersion();

        ResponseEntity<BootstrapDataResponseDto> subsequentResponse = controller.getFullData(initialEtag);

        assertEquals(HttpStatus.OK, subsequentResponse.getStatusCode());
        assertNotNull(subsequentResponse.getBody());
        assertNotEquals(initialEtag, subsequentResponse.getHeaders().getETag());
    }

    @Test
    @DisplayName("GET /api/bootstrap/config returns modular config with ETag support")
    void testGetBootstrapConfig() {
        ResponseEntity<Map<String, Object>> response = controller.getBootstrapConfig(null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().containsKey("announcement"));
        assertTrue(response.getBody().containsKey("siteBranding"));
        assertNotNull(response.getHeaders().getETag());

        String etag = response.getHeaders().getETag();
        ResponseEntity<Map<String, Object>> cachedResponse = controller.getBootstrapConfig(etag);
        assertEquals(HttpStatus.NOT_MODIFIED, cachedResponse.getStatusCode());
    }

    @Test
    @DisplayName("GET /api/catalog/categories returns active categories with ETag support")
    void testGetCatalogCategories() {
        ResponseEntity<List<Map<String, Object>>> response = controller.getCatalogCategories(null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertNotNull(response.getHeaders().getETag());

        String etag = response.getHeaders().getETag();
        ResponseEntity<List<Map<String, Object>>> cachedResponse = controller.getCatalogCategories(etag);
        assertEquals(HttpStatus.NOT_MODIFIED, cachedResponse.getStatusCode());
    }

    @Test
    @DisplayName("POST /api/work-requests returns 503 MAINTENANCE_ACTIVE when maintenance mode is active")
    void testCreateWorkRequestFailsWhenMaintenanceActive() {
        when(platformConfigService.isPlatformInMaintenance("customer_web")).thenReturn(true);
        when(platformConfigService.getMaintenanceStatus("customer_web")).thenReturn(Map.of(
                "enabled", true,
                "title", "Scheduled Maintenance",
                "message", "Platform is undergoing upgrades",
                "scope", "ALL"
        ));

        com.apexservices.dto.WorkRequestDto dto = new com.apexservices.dto.WorkRequestDto();
        ResponseEntity<?> response = controller.createWorkRequest(dto, null);

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("MAINTENANCE_ACTIVE", body.get("code"));
    }
}
