package com.apexservices;

import com.apexservices.dto.CategoryRequestDto;
import com.apexservices.dto.ServiceCategoryDto;
import com.apexservices.model.Category;
import com.apexservices.repository.CategoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@DisplayName("Integration Tests - Category Lifecycle & Soft Delete Operations")
public class CategoryOperationIntegrationTest {

    @Autowired
    private CategoryRepository categoryRepository;

    @Test
    @DisplayName("Should create category with unique slug and active status")
    void testCreateCategory() {
        Category category = Category.builder()
                .name("HVAC AC Servicing")
                .slug("hvac-ac-servicing")
                .description("Comprehensive AC repair and filter cleaning")
                .active(true)
                .build();

        Category saved = categoryRepository.save(category);
        assertNotNull(saved.getId());
        assertEquals("HVAC AC Servicing", saved.getName());
        assertEquals("hvac-ac-servicing", saved.getSlug());
        assertTrue(saved.isActive());
    }

    @Test
    @DisplayName("Should perform soft delete by toggling active to false")
    void testSoftDeleteCategory() {
        Category category = categoryRepository.save(Category.builder()
                .name("Appliance Repair")
                .slug("appliance-repair")
                .description("Washing machines and microwaves")
                .active(true)
                .build());

        Long catId = category.getId();
        assertTrue(category.isActive());

        // Soft delete: Deactivate category
        category.setActive(false);
        categoryRepository.save(category);

        Category softDeleted = categoryRepository.findById(catId).orElseThrow();
        assertFalse(softDeleted.isActive(), "Category should be deactivated (soft deleted)");

        // Verify active query filters it out
        List<Category> activeCategories = categoryRepository.findByActiveTrueOrderByIdAsc();
        assertFalse(activeCategories.stream().anyMatch(c -> c.getId().equals(catId)),
                "Soft deleted category must not appear in active public catalog");

        // Verify admin full query still retains it
        List<Category> allCategories = categoryRepository.findAllByOrderByIdAsc();
        assertTrue(allCategories.stream().anyMatch(c -> c.getId().equals(catId)),
                "Soft deleted category must remain visible to administrators");
    }

    @Test
    @DisplayName("Should restore soft-deleted category back to active")
    void testRestoreCategory() {
        Category category = categoryRepository.save(Category.builder()
                .name("Solar Panel Maintenance")
                .slug("solar-panel-maintenance")
                .description("Rooftop solar maintenance")
                .active(false)
                .build());

        Long catId = category.getId();
        assertFalse(category.isActive());

        // Restore: Reactivate category
        category.setActive(true);
        categoryRepository.save(category);

        Category restored = categoryRepository.findById(catId).orElseThrow();
        assertTrue(restored.isActive(), "Category should be restored to active status");

        List<Category> activeCategories = categoryRepository.findByActiveTrueOrderByIdAsc();
        assertTrue(activeCategories.stream().anyMatch(c -> c.getId().equals(catId)),
                "Restored category must now appear in active public catalog");
    }

    @Test
    @DisplayName("Should prevent duplicate slugs")
    void testDuplicateSlugDetection() {
        categoryRepository.save(Category.builder()
                .name("Painting Services")
                .slug("painting-services")
                .description("Interior and exterior painting")
                .active(true)
                .build());

        boolean exists = categoryRepository.existsBySlug("painting-services");
        assertTrue(exists, "Slug existence check should return true for existing slug");
    }
}
