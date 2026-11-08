package com.apexservices.service;

import com.apexservices.dto.request.CategoryRequestDto;
import com.apexservices.dto.request.CategoryStatusRequest;
import com.apexservices.dto.response.ServiceCategoryDto;
import com.apexservices.exception.ConflictException;
import com.apexservices.model.Category;
import com.apexservices.model.Icon;
import com.apexservices.repository.CategoryRepository;
import com.apexservices.security.InputSanitizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final IconService iconService;
    private final ContentVersionService contentVersionService;

    public List<Map<String, Object>> getCategories() {
        List<Category> dbCategories = categoryRepository.findAllByOrderByIdAsc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Category c : dbCategories) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", c.getId());
            map.put("name", c.getName());
            map.put("slug", c.getSlug());
            map.put("description", c.getDescription());
            map.put("tag", c.getTag());
            map.put("active", c.isActive());
            map.put("isSoftDeleted", !c.isActive());
            map.put("bannerImageUrl", c.getBannerImageUrl() != null ? c.getBannerImageUrl() : "");
            if (c.getIcon() != null) {
                map.put("iconId", c.getIcon().getId());
                map.put("iconName", c.getIcon().getIconValue());
                map.put("icon", c.getIcon());
            } else {
                map.put("iconId", null);
                map.put("iconName", "Hammer");
                map.put("icon", null);
            }
            result.add(map);
        }
        return result;
    }

    public ServiceCategoryDto toServiceCategoryDto(Category c) {
        long partnerCount = categoryRepository.countPartnersByCategoryId(c.getId());
        long requestCount = categoryRepository.countRequestsByCategoryIdAndName(c.getId(), c.getName());
        return ServiceCategoryDto.builder()
                .id(c.getId())
                .name(c.getName())
                .slug(c.getSlug())
                .description(c.getDescription())
                .tag(c.getTag())
                .bannerImageUrl(c.getBannerImageUrl())
                .active(c.isActive())
                .isSoftDeleted(!c.isActive())
                .iconId(c.getIcon() != null ? c.getIcon().getId() : null)
                .iconName(c.getIcon() != null ? c.getIcon().getIconValue() : "Hammer")
                .partnerCount(partnerCount)
                .requestCount(requestCount)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    public List<ServiceCategoryDto> getAdminServiceCategories(String search, Boolean active) {
        List<Category> all = categoryRepository.findAllByOrderByIdAsc();
        List<ServiceCategoryDto> result = new ArrayList<>();
        for (Category c : all) {
            if (active != null && c.isActive() != active) {
                continue;
            }
            if (search != null && !search.isBlank()) {
                String term = search.trim().toLowerCase();
                boolean matches = (c.getName() != null && c.getName().toLowerCase().contains(term))
                        || (c.getDescription() != null && c.getDescription().toLowerCase().contains(term))
                        || (c.getSlug() != null && c.getSlug().toLowerCase().contains(term));
                if (!matches) {
                    continue;
                }
            }
            result.add(toServiceCategoryDto(c));
        }
        return result;
    }

    @Transactional
    public ServiceCategoryDto createAdminServiceCategory(CategoryRequestDto body) {
        String name = InputSanitizer.sanitize(body.getName());
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new ConflictException("A service category with this name already exists.");
        }

        String slug = body.getSlug() != null && !body.getSlug().isBlank()
                ? InputSanitizer.sanitize(body.getSlug()).toLowerCase().replaceAll("[^a-z0-9]+", "-")
                : name.trim().toLowerCase().replaceAll("[^a-z0-9]+", "-");

        if (categoryRepository.existsBySlug(slug)) {
            slug = slug + "-" + (System.currentTimeMillis() % 1000);
        }

        String description = InputSanitizer.sanitize(body.getDescription());
        String tag = body.getTag() != null && !body.getTag().isBlank() ? InputSanitizer.sanitize(body.getTag()) : "Popular";
        boolean active = body.getActive() != null ? body.getActive() : true;

        Icon icon = iconService.resolveIcon(body, name);

        Category cat = Category.builder()
                .name(name)
                .slug(slug)
                .description(description)
                .tag(tag)
                .active(active)
                .icon(icon)
                .bannerImageUrl(body.getBannerImageUrl())
                .build();

        Category saved = categoryRepository.save(cat);
        contentVersionService.bumpVersion();
        return toServiceCategoryDto(saved);
    }

    @Transactional
    public ServiceCategoryDto updateAdminServiceCategory(Long id, CategoryRequestDto body) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Category not found with ID: " + id));

        String name = InputSanitizer.sanitize(body.getName());
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ConflictException("Another category already exists with the name: " + name);
        }

        String slug = body.getSlug() != null && !body.getSlug().isBlank()
                ? InputSanitizer.sanitize(body.getSlug()).toLowerCase().replaceAll("[^a-z0-9]+", "-")
                : name.trim().toLowerCase().replaceAll("[^a-z0-9]+", "-");

        if (categoryRepository.existsBySlugAndIdNot(slug, id)) {
            throw new ConflictException("Another category already uses the slug: " + slug);
        }

        category.setName(name);
        category.setSlug(slug);
        if (body.getDescription() != null) category.setDescription(InputSanitizer.sanitize(body.getDescription()));
        if (body.getTag() != null) category.setTag(InputSanitizer.sanitize(body.getTag()));
        if (body.getActive() != null) category.setActive(body.getActive());
        if (body.getBannerImageUrl() != null) category.setBannerImageUrl(body.getBannerImageUrl());

        Icon icon = iconService.resolveIcon(body, name);
        if (icon != null) {
            category.setIcon(icon);
        }

        Category saved = categoryRepository.save(category);
        contentVersionService.bumpVersion();
        return toServiceCategoryDto(saved);
    }

    @Transactional
    public ServiceCategoryDto toggleCategoryStatus(Long id, CategoryStatusRequest req) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Category not found with ID: " + id));

        boolean newStatus = (req != null && req.getActive() != null) ? req.getActive() : !category.isActive();
        category.setActive(newStatus);
        Category saved = categoryRepository.save(category);
        contentVersionService.bumpVersion();
        return toServiceCategoryDto(saved);
    }

    @Transactional
    public Map<String, Object> addCategory(CategoryRequestDto body) {
        String name = InputSanitizer.sanitize(body.getName());
        String description = InputSanitizer.sanitize(body.getDescription());
        String tag = body.getTag() != null && !body.getTag().isBlank() ? InputSanitizer.sanitize(body.getTag()) : "Popular";

        Icon icon = iconService.resolveIcon(body, name);

        Category category = Category.builder()
                .name(name)
                .description(description)
                .tag(tag)
                .icon(icon)
                .bannerImageUrl(body.getBannerImageUrl())
                .build();
        Category saved = categoryRepository.save(category);
        contentVersionService.bumpVersion();

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", saved.getId());
        map.put("name", saved.getName());
        map.put("description", saved.getDescription());
        map.put("tag", saved.getTag());
        map.put("bannerImageUrl", saved.getBannerImageUrl());
        if (saved.getIcon() != null) {
            map.put("iconId", saved.getIcon().getId());
            map.put("iconName", saved.getIcon().getIconValue());
            map.put("icon", saved.getIcon());
        }
        return map;
    }

    @Transactional
    public Map<String, Object> updateCategory(Long id, CategoryRequestDto body) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Category not found with ID: " + id));

        if (body.getName() != null) category.setName(InputSanitizer.sanitize(body.getName()));
        if (body.getDescription() != null) category.setDescription(InputSanitizer.sanitize(body.getDescription()));
        if (body.getTag() != null) category.setTag(InputSanitizer.sanitize(body.getTag()));
        if (body.getBannerImageUrl() != null) category.setBannerImageUrl(body.getBannerImageUrl());

        Icon icon = iconService.resolveIcon(body, category.getName());
        if (icon != null) {
            category.setIcon(icon);
        }

        Category saved = categoryRepository.save(category);
        contentVersionService.bumpVersion();

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", saved.getId());
        map.put("name", saved.getName());
        map.put("description", saved.getDescription());
        map.put("tag", saved.getTag());
        map.put("bannerImageUrl", saved.getBannerImageUrl());
        if (saved.getIcon() != null) {
            map.put("iconId", saved.getIcon().getId());
            map.put("iconName", saved.getIcon().getIconValue());
            map.put("icon", saved.getIcon());
        }
        return map;
    }

    @Transactional
    public Map<String, Object> deleteCategory(Long id, boolean permanent) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Category not found with ID: " + id));

        if (permanent) {
            categoryRepository.deleteById(id);
            contentVersionService.bumpVersion();
            return Map.of("message", "Category permanently deleted", "id", id);
        } else {
            category.setActive(false);
            Category saved = categoryRepository.save(category);
            contentVersionService.bumpVersion();
            Map<String, Object> res = new HashMap<>();
            res.put("serviceCategory", toServiceCategoryDto(saved));
            return res;
        }
    }

    @Transactional
    public ServiceCategoryDto restoreCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Category not found with ID: " + id));

        category.setActive(true);
        Category saved = categoryRepository.save(category);
        contentVersionService.bumpVersion();
        return toServiceCategoryDto(saved);
    }
}
