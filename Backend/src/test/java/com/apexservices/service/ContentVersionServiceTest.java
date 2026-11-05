package com.apexservices.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Unit Tests - ContentVersionService & ETag Lifecycle")
class ContentVersionServiceTest {

    private ContentVersionService service;

    @BeforeEach
    void setUp() {
        service = new ContentVersionService();
    }

    @Test
    @DisplayName("Initial version generates valid RFC 7232 ETags")
    void testInitialVersionAndEtags() {
        long v = service.getVersion();
        assertTrue(v > 0, "Initial version should be positive epoch millis");

        String dataEtag = service.getDataEtag();
        String cfgEtag = service.getConfigEtag();
        String catEtag = service.getCategoryEtag();

        assertTrue(dataEtag.startsWith("\"v") && dataEtag.endsWith("\""));
        assertTrue(cfgEtag.startsWith("\"cfg_") && cfgEtag.endsWith("\""));
        assertTrue(catEtag.startsWith("\"cat_") && catEtag.endsWith("\""));
    }

    @Test
    @DisplayName("bumpVersion increments version and generates fresh ETags")
    void testBumpVersion() {
        long v1 = service.getVersion();
        String etag1 = service.getDataEtag();

        long v2 = service.bumpVersion();
        String etag2 = service.getDataEtag();

        assertTrue(v2 > v1, "Version should strictly increase");
        assertNotEquals(etag1, etag2, "ETag must change after version bump");
    }

    @Test
    @DisplayName("matches correctly handles exact, weak, and wildcard ETags")
    void testEtagMatching() {
        String etag = service.getDataEtag(); // e.g. "v12345"

        // Exact match
        assertTrue(service.matches(etag, etag));

        // Weak match from client
        assertTrue(service.matches("W/" + etag, etag));

        // Wildcard match
        assertTrue(service.matches("*", etag));

        // Comma-separated list with weak prefix
        assertTrue(service.matches("\"other\", W/" + etag, etag));

        // Mismatch
        assertFalse(service.matches("\"v999999999\"", etag));

        // Null and blank handling
        assertFalse(service.matches(null, etag));
        assertFalse(service.matches("", etag));
        assertFalse(service.matches("   ", etag));
        assertFalse(service.matches(etag, null));
    }
}
