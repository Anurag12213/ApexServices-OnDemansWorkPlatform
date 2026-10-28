package com.apexservices;

import com.apexservices.dto.WorkRequestClaimResponseDto;
import com.apexservices.dto.WorkRequestDto;
import com.apexservices.dto.WorkRequestResponseDto;
import com.apexservices.exception.ConflictException;
import com.apexservices.model.AuthProvider;
import com.apexservices.model.Role;
import com.apexservices.model.User;
import com.apexservices.model.WorkRequestStatus;
import com.apexservices.model.Category;
import com.apexservices.repository.CategoryRepository;
import com.apexservices.repository.UserRepository;
import com.apexservices.service.WorkRequestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class WorkRequestDispatchIntegrationTest {

    @Autowired
    private WorkRequestService workRequestService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private User partner1;
    private User partner2;
    private Category carpentryCategory;

    @BeforeEach
    void setUp() {
        carpentryCategory = categoryRepository.findByNameIgnoreCase("Custom Carpentry").orElseGet(() ->
                categoryRepository.save(Category.builder()
                        .name("Custom Carpentry")
                        .slug("custom-carpentry")
                        .description("Professional carpentry services")
                        .active(true)
                        .build())
        );
        if (!carpentryCategory.isActive()) {
            carpentryCategory.setActive(true);
            carpentryCategory = categoryRepository.save(carpentryCategory);
        }

        Category finalCarpentryCategory = carpentryCategory;

        partner1 = userRepository.findByEmail("test.partner1@apexservices.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("Rajesh Carpentry")
                        .email("test.partner1@apexservices.com")
                        .mobileNumber("+919876543210")
                        .password("$2a$10$eD7q9rQvE7.yPskqK8qE6e2Uj1zZpCskJgUqYf45kR2lBvT5/m8q6")
                        .role(Role.ROLE_PARTNER)
                        .provider(AuthProvider.LOCAL)
                        .active(true)
                        .serviceCategories(new HashSet<>(Collections.singletonList(finalCarpentryCategory)))
                        .build())
        );

        if (partner1.getServiceCategories() == null || partner1.getServiceCategories().isEmpty()) {
            partner1.setServiceCategories(new HashSet<>(Collections.singletonList(finalCarpentryCategory)));
            partner1 = userRepository.save(partner1);
        }

        partner2 = userRepository.findByEmail("test.partner2@apexservices.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("Suresh Electricals")
                        .email("test.partner2@apexservices.com")
                        .mobileNumber("+919876543211")
                        .password("$2a$10$eD7q9rQvE7.yPskqK8qE6e2Uj1zZpCskJgUqYf45kR2lBvT5/m8q6")
                        .role(Role.ROLE_PARTNER)
                        .provider(AuthProvider.LOCAL)
                        .active(true)
                        .serviceCategories(new HashSet<>(Collections.singletonList(finalCarpentryCategory)))
                        .build())
        );

        if (partner2.getServiceCategories() == null || partner2.getServiceCategories().isEmpty()) {
            partner2.setServiceCategories(new HashSet<>(Collections.singletonList(finalCarpentryCategory)));
            partner2 = userRepository.save(partner2);
        }
    }

    @Test
    @DisplayName("1. Customer submission creates broadcast with 45s countdown and appears in partner feed")
    void testCreateAndFeed() {
        WorkRequestDto dto = WorkRequestDto.builder()
                .serviceCategory("Custom Carpentry")
                .customerName("Anita Desai")
                .customerEmail("anita.desai@gmail.com")
                .contactPhone("+919811122233")
                .serviceAddress("102 Green Heights, Mumbai")
                .problemDescription("Door lock hinge is loose.")
                .urgency("Standard")
                .build();

        WorkRequestResponseDto created = workRequestService.createWorkRequest(dto, null);
        assertNotNull(created.getId());
        assertEquals("BROADCASTED", created.getStatus());
        assertEquals(1, created.getStage());
        assertNotNull(created.getExpiresAt());
        assertTrue(created.getRemainingSeconds() > 0 && created.getRemainingSeconds() <= 120);

        // Verify partner1 sees it in feed
        List<WorkRequestResponseDto> feed = workRequestService.getPartnerFeed(partner1.getEmail(), "Custom Carpentry");
        boolean found = feed.stream().anyMatch(r -> r.getId().equals(created.getId()));
        assertTrue(found, "Newly created request should appear in partner's feed");
    }

    @Test
    @DisplayName("2. First partner wins claim; second partner receives HTTP 409 Conflict (ALREADY_CLAIMED)")
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

        // Partner 1 claims the request
        WorkRequestClaimResponseDto claimResult = workRequestService.claimWorkRequest(created.getId(), partner1.getEmail());
        assertTrue(claimResult.isSuccess());
        assertNotNull(claimResult.getRequest());
        assertEquals("ASSIGNED", claimResult.getRequest().getStatus());
        assertEquals(partner1.getId(), claimResult.getRequest().getAssignedPartnerId());

        // Partner 2 attempts to claim the same request -> ConflictException expected
        ConflictException ex = assertThrows(ConflictException.class, () ->
                workRequestService.claimWorkRequest(created.getId(), partner2.getEmail())
        );

        assertEquals("ALREADY_CLAIMED", ex.getCode());
        assertTrue(ex.getMessage().contains("already claimed"));
    }

    @Test
    @DisplayName("3. Partner rejection is isolated and does not affect other partners")
    void testRejectionIsolation() {
        WorkRequestDto dto = WorkRequestDto.builder()
                .serviceCategory("Custom Carpentry")
                .customerName("Pooja Nair")
                .customerEmail("pooja@gmail.com")
                .contactPhone("+919833344455")
                .serviceAddress("701 Sunrise View, Mumbai")
                .problemDescription("Cabinet door fallen off.")
                .build();

        WorkRequestResponseDto created = workRequestService.createWorkRequest(dto, null);

        // Partner 1 rejects
        Map<String, Object> rejectResult = workRequestService.rejectWorkRequest(created.getId(), partner1.getEmail());
        assertTrue((Boolean) rejectResult.get("success"));

        // Partner 1 should NOT see it anymore
        List<WorkRequestResponseDto> feed1 = workRequestService.getPartnerFeed(partner1.getEmail(), "Custom Carpentry");
        assertFalse(feed1.stream().anyMatch(r -> r.getId().equals(created.getId())));

        // Partner 2 should STILL see it
        List<WorkRequestResponseDto> feed2 = workRequestService.getPartnerFeed(partner2.getEmail(), "Custom Carpentry");
        assertTrue(feed2.stream().anyMatch(r -> r.getId().equals(created.getId())));
    }
}
