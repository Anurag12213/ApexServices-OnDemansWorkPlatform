package com.apexservices;

import com.apexservices.dto.request.WorkRequestDto;
import com.apexservices.dto.response.WorkRequestClaimResponseDto;
import com.apexservices.dto.response.WorkRequestResponseDto;
import com.apexservices.exception.ConflictException;
import com.apexservices.model.AuthProvider;
import com.apexservices.model.Category;
import com.apexservices.model.Role;
import com.apexservices.model.User;
import com.apexservices.repository.CategoryRepository;
import com.apexservices.repository.UserRepository;
import com.apexservices.repository.WorkRequestRepository;
import com.apexservices.service.WorkRequestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("Integration Tests - Post & Pick Marketplace, Atomic Claims & Lifecycle")
class WorkRequestDispatchIntegrationTest {

    @Autowired
    private WorkRequestService workRequestService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private WorkRequestRepository workRequestRepository;

    private User partner1;
    private User partner2;
    private Category carpentryCategory;

    @BeforeEach
    void setUp() {
        carpentryCategory = categoryRepository.findByNameIgnoreCase("Custom Carpentry").orElse(null);
        if (carpentryCategory == null) {
            carpentryCategory = Category.builder()
                    .name("Custom Carpentry")
                    .slug("custom-carpentry")
                    .active(true)
                    .description("Carpentry works")
                    .build();
            carpentryCategory = categoryRepository.save(carpentryCategory);
        }

        final Category finalCarpentryCategory = carpentryCategory;

        partner1 = userRepository.findByEmail("partner.dispatch1@apexservices.com").orElse(null);
        if (partner1 == null) {
            partner1 = User.builder()
                    .fullName("Ramesh Carpenter")
                    .email("partner.dispatch1@apexservices.com")
                    .password("$2a$10$unusableHashForTesting0000000000000000000000000000000000")
                    .provider(AuthProvider.LOCAL)
                    .role(Role.ROLE_PARTNER)
                    .active(true)
                    .mobileNumber("+919800000001")
                    .serviceCategories(new HashSet<>(Collections.singletonList(finalCarpentryCategory)))
                    .build();
            partner1 = userRepository.save(partner1);
        } else {
            partner1.setServiceCategories(new HashSet<>(Collections.singletonList(finalCarpentryCategory)));
            partner1 = userRepository.save(partner1);
        }

        partner2 = userRepository.findByEmail("partner.dispatch2@apexservices.com").orElse(null);
        if (partner2 == null) {
            partner2 = User.builder()
                    .fullName("Suresh Carpenter")
                    .email("partner.dispatch2@apexservices.com")
                    .password("$2a$10$unusableHashForTesting0000000000000000000000000000000000")
                    .provider(AuthProvider.LOCAL)
                    .role(Role.ROLE_PARTNER)
                    .active(true)
                    .mobileNumber("+919800000002")
                    .serviceCategories(new HashSet<>(Collections.singletonList(finalCarpentryCategory)))
                    .build();
            partner2 = userRepository.save(partner2);
        } else {
            partner2.setServiceCategories(new HashSet<>(Collections.singletonList(finalCarpentryCategory)));
            partner2 = userRepository.save(partner2);
        }
    }

    @Test
    @DisplayName("1. Customer submission publishes request as POSTED in marketplace")
    void testCreateAndFeed() {
        WorkRequestDto dto = WorkRequestDto.builder()
                .serviceCategory("Custom Carpentry")
                .customerName("Anita Desai")
                .customerEmail("anita.desai@gmail.com")
                .contactPhone("+919811122233")
                .serviceAddress("102 Green Heights, Mumbai")
                .latitude(new BigDecimal("19.0760"))
                .longitude(new BigDecimal("72.8777"))
                .problemDescription("Door lock hinge is loose.")
                .urgency("Standard")
                .build();

        WorkRequestResponseDto created = workRequestService.createWorkRequest(dto, null);
        assertNotNull(created.getId());
        assertEquals("POSTED", created.getStatus());
        assertEquals(1, created.getStage());
        assertNotNull(created.getExpiresAt());

        // Verify all eligible partners see the published request in All Jobs
        List<WorkRequestResponseDto> allJobs = workRequestService.getPartnerAllJobs(partner1.getEmail(), "Custom Carpentry");
        boolean found = allJobs.stream().anyMatch(r -> r.getId().equals(created.getId()));
        assertTrue(found, "Newly published request should appear in partner's marketplace feed");
    }

    @Test
    @DisplayName("2. First partner wins acceptance; second partner receives HTTP 409 Conflict (ALREADY_CLAIMED)")
    void testAtomicClaimAndConflict() {
        WorkRequestDto dto = WorkRequestDto.builder()
                .serviceCategory("Custom Carpentry")
                .customerName("Vikram Seth")
                .customerEmail("vikram@gmail.com")
                .contactPhone("+919822233344")
                .serviceAddress("404 Blue Ocean Tower, Mumbai")
                .problemDescription("Table leg broken.")
                .build();

        WorkRequestResponseDto created = workRequestService.createWorkRequest(dto, null);

        // Partner 1 accepts the request atomically
        WorkRequestClaimResponseDto claimResult = workRequestService.acceptJobAtomically(created.getId(), partner1.getEmail());
        assertTrue(claimResult.isSuccess());
        assertNotNull(claimResult.getRequest());
        assertEquals("ASSIGNED", claimResult.getRequest().getStatus());
        assertEquals(partner1.getId(), claimResult.getRequest().getAssignedPartnerId());

        // Partner 2 attempts to accept the same request -> ConflictException expected
        ConflictException ex = assertThrows(ConflictException.class, () ->
                workRequestService.acceptJobAtomically(created.getId(), partner2.getEmail())
        );

        assertEquals("ALREADY_CLAIMED", ex.getCode());
        assertTrue(ex.getMessage().contains("already accepted") || ex.getMessage().contains("already claimed"));
    }

    @Test
    @DisplayName("3. Nearby Jobs distance filtering and privacy masking for unassigned partners")
    void testNearbyDistanceFilteringAndPrivacy() {
        WorkRequestDto dto = WorkRequestDto.builder()
                .serviceCategory("Custom Carpentry")
                .customerName("Private Customer")
                .customerEmail("private@gmail.com")
                .contactPhone("+919833344455")
                .serviceAddress("Exact Flat 501, Secret Street, Mumbai")
                .latitude(new BigDecimal("19.0760"))
                .longitude(new BigDecimal("72.8777"))
                .landmark("Near Metro Station")
                .cityPostal("Mumbai 400001")
                .problemDescription("Cabinet door fallen off.")
                .build();

        WorkRequestResponseDto created = workRequestService.createWorkRequest(dto, null);

        // Partner 1 queries nearby jobs within 10 km (same coordinate area)
        List<WorkRequestResponseDto> nearby = workRequestService.getPartnerNearbyJobs(
                partner1.getEmail(), 19.0760, 72.8777, 10.0, "Custom Carpentry");
        
        Optional<WorkRequestResponseDto> found = nearby.stream()
                .filter(j -> j.getId().equals(created.getId()))
                .findFirst();

        assertTrue(found.isPresent(), "Job should be discovered within 10km radius");
        WorkRequestResponseDto job = found.get();
        assertNotNull(job.getDistanceKm());
        assertTrue(job.getDistanceKm() < 1.0, "Distance should be under 1 km for same coordinates");

        // Verify privacy masking before acceptance: exact street address, phone, and email hidden
        assertNull(job.getCustomerEmail());
        assertNull(job.getContactPhone());
        assertFalse(job.getServiceAddress().contains("Exact Flat 501"));
        assertTrue(job.getServiceAddress().contains("Near Metro Station") || job.getServiceAddress().contains("Mumbai 400001"));
    }
}
