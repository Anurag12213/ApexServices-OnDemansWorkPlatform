package com.apexservices.controller;

import com.apexservices.dto.CategoryRequestDto;
import com.apexservices.dto.CategoryStatusRequest;
import com.apexservices.dto.ServiceCategoryDto;
import com.apexservices.dto.WorkRequestClaimResponseDto;
import com.apexservices.dto.WorkRequestDto;
import com.apexservices.dto.WorkRequestResponseDto;
import com.apexservices.model.Category;
import com.apexservices.model.Icon;
import com.apexservices.repository.CategoryRepository;
import com.apexservices.repository.IconRepository;
import com.apexservices.security.InputSanitizer;
import com.apexservices.service.PartnerPresenceService;
import com.apexservices.service.WorkRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.security.Principal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
public class ContentDataController {

    private final CategoryRepository categoryRepository;
    private final IconRepository iconRepository;
    private final WorkRequestService workRequestService;
    private final PartnerPresenceService presenceService;
    private final com.apexservices.service.ReviewService reviewService;
    private final com.apexservices.service.PartnerProfileService partnerProfileService;
    private final com.apexservices.repository.UserRepository userRepository;

    private final Map<String, Object> siteBranding = new ConcurrentHashMap<>();
    private final Map<String, Object> announcement = new ConcurrentHashMap<>();
    private final Map<String, Object> aiOwnerSection = new ConcurrentHashMap<>();
    private final List<Map<String, Object>> heroSlides = new CopyOnWriteArrayList<>();
    private final List<Map<String, Object>> reviews = new CopyOnWriteArrayList<>();
    private final List<Map<String, Object>> workRequests = new CopyOnWriteArrayList<>();

    @PostConstruct
    public void init() {
        initDefaultData();
        loadPersistedContentState();
    }

    @SuppressWarnings("unchecked")
    private synchronized void persistContentState() {
        try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("site_content_config.dat"))) {
            Map<String, Object> state = new HashMap<>();
            state.put("siteBranding", new HashMap<>(siteBranding));
            state.put("announcement", new HashMap<>(announcement));
            state.put("aiOwnerSection", new HashMap<>(aiOwnerSection));
            state.put("heroSlides", new ArrayList<>(heroSlides));
            state.put("reviews", new ArrayList<>(reviews));
            oos.writeObject(state);
            log.info("Site content state successfully saved to disk.");
        } catch (Exception e) {
            log.warn("Failed to persist site content state to disk: {}", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private synchronized void loadPersistedContentState() {
        try {
            File file = new File("site_content_config.dat");
            if (file.exists() && file.length() > 0) {
                try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream(file))) {
                    Object obj = ois.readObject();
                    if (obj instanceof Map<?, ?> state) {
                        if (state.get("siteBranding") instanceof Map<?, ?> m) {
                            siteBranding.putAll((Map<String, Object>) m);
                        }
                        if (state.get("announcement") instanceof Map<?, ?> m) {
                            announcement.putAll((Map<String, Object>) m);
                        }
                        if (state.get("aiOwnerSection") instanceof Map<?, ?> m) {
                            aiOwnerSection.putAll((Map<String, Object>) m);
                        }
                        if (state.get("heroSlides") instanceof List<?> l && !l.isEmpty()) {
                            heroSlides.clear();
                            heroSlides.addAll((List<Map<String, Object>>) l);
                        }
                        if (state.get("reviews") instanceof List<?> l && !l.isEmpty()) {
                            reviews.clear();
                            reviews.addAll((List<Map<String, Object>>) l);
                        }
                        log.info("Persisted site content state loaded from disk: brandDotColor={}", siteBranding.get("brandDotColor"));
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to load persisted site content state from disk: {}", e.getMessage());
        }
    }

    private void initDefaultData() {
        // 1. Site Branding
        siteBranding.put("brandName", "ApexServices");
        siteBranding.put("brandDotColor", "#ff3b47");
        siteBranding.put("logoImageUrl", "");
        siteBranding.put("headerCtaText", "REQUEST NOW");
        siteBranding.put("headerOperatingHours", "MON - SAT: 7:00 AM - 9:00 PM | SUN: EMERGENCY DISPATCH");
        siteBranding.put("supportPhone", "+91 1800 200 4567");
        siteBranding.put("supportEmail", "support@apexservices.com");
        siteBranding.put("categoriesBadge", "OUR SPECIALTIES");
        siteBranding.put("categoriesHeading", "Featured Service Categories");
        siteBranding.put("categoriesSubtitle", "From custom carpentry to emergency plumbing and electrical care.");
        siteBranding.put("reviewsBadge", "VERIFIED REVIEWS");
        siteBranding.put("reviewsHeading", "What Our Customers Say");
        siteBranding.put("footerTagline", "Premium home repair, custom carpentry, plumbing, and electrical solutions.");
        siteBranding.put("footerAddress", "124 Executive Parkway, Suite 400");
        siteBranding.put("footerCopyright", "ApexServices. All rights reserved.");

        // 2. Announcement
        announcement.put("enabled", true);
        announcement.put("text", "🔥 Seasonal Offer: Get 20% OFF on all Carpentry, Plumbing & AC Services this week! Use Code: APEX20");

        // 3. AI Owner Section
        aiOwnerSection.put("ownerName", "Anurag Vijaywargiy");
        aiOwnerSection.put("ownerTitle", "Founder & Master Operations Director");
        aiOwnerSection.put("badge", "FOUNDER'S DIRECT GUARANTEE");
        aiOwnerSection.put("headingText", "Your Peace of Mind is Our Top Priority!");
        aiOwnerSection.put("indicatedText", "We personally guarantee top-quality workmanship on every job. If you're not 100% satisfied with our carpentry, plumbing, or electrical repair, we'll fix it completely free of charge!");
        aiOwnerSection.put("buttonText", "REQUEST NOW");
        aiOwnerSection.put("imageUrl", "/anurag_founder.jpg");

        // 4. Hero Slides
        Map<String, Object> s1 = new LinkedHashMap<>();
        s1.put("id", "slide-1");
        s1.put("badge", "PRO APPROVED SERVICES");
        s1.put("title", "Expert Home Services At Your Doorstep");
        s1.put("subtitle", "From precision carpentry to emergency plumbing and electrical solutions — reliable professionals ready 24/7.");
        s1.put("buttonText", "Request Service Now");
        s1.put("imageUrl", "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=80");
        heroSlides.add(s1);

        Map<String, Object> s2 = new LinkedHashMap<>();
        s2.put("id", "slide-2");
        s2.put("badge", "CRAFT & REPAIR EXCELLENCE");
        s2.put("title", "Master Carpentry & Custom Woodwork");
        s2.put("subtitle", "Custom furniture fitting, door restoration, cabinetry, and structural repair by certified craftsmen.");
        s2.put("buttonText", "Book Woodwork Special");
        s2.put("imageUrl", "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1400&q=80");
        heroSlides.add(s2);

        Map<String, Object> s3 = new LinkedHashMap<>();
        s3.put("id", "slide-3");
        s3.put("badge", "RAPID RESPONSE");
        s3.put("title", "Fast Plumbing & Electrical Repairs");
        s3.put("subtitle", "Zero hassle leakage repair, wiring upgrades, breaker fixes, and full maintenance packages.");
        s3.put("buttonText", "Explore Emergency Care");
        s3.put("imageUrl", "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=80");
        heroSlides.add(s3);

        // 5. Reviews
        addReview("rev-1", "Sarah Jenkins", "Homeowner", 5, "The carpentry team redesigned our custom kitchen cabinets flawlessly! Fast, polite, and very clean work.", "Custom Carpentry", "2 days ago", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80");
        addReview("rev-2", "David Miller", "Property Manager", 5, "Called their emergency plumbing team at 11 PM for a burst pipe. They arrived in 25 minutes and fixed it completely!", "Emergency Plumbing", "1 week ago", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80");
        addReview("rev-3", "Elena Rostova", "Interior Designer", 5, "Outstanding electrical and lighting installation. Their attention to safety and detail is unmatched in the area.", "Electrical Maintenance", "3 weeks ago", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80");
    }

    private void addReview(String id, String name, String role, int rating, String comment, String serviceUsed, String date, String avatar) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("id", id);
        r.put("name", name);
        r.put("role", role);
        r.put("rating", rating);
        r.put("comment", comment);
        r.put("serviceUsed", serviceUsed);
        r.put("date", date);
        r.put("avatar", avatar);
        reviews.add(r);
    }

    // --- FULL PRESENTATION DATA ENDPOINT ---
    @GetMapping("/data")
    public ResponseEntity<Map<String, Object>> getFullData() {
        Map<String, Object> full = new LinkedHashMap<>();
        full.put("announcement", announcement);
        full.put("heroSlides", heroSlides);
        full.put("aiOwnerSection", aiOwnerSection);
        full.put("categories", getCategories().getBody());
        full.put("reviews", reviews);
        full.put("siteBranding", siteBranding);
        full.put("publicConfig", siteBranding);
        return ResponseEntity.ok(full);
    }

    // --- ADMIN SETTINGS & BRANDING ---
    @GetMapping({"/admin/settings", "/settings"})
    public ResponseEntity<Map<String, Object>> getSettings() {
        return ResponseEntity.ok(siteBranding);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping({"/admin/settings", "/settings"})
    public ResponseEntity<Map<String, Object>> updateSettings(@RequestBody Map<String, Object> updates) {
        siteBranding.putAll(updates);
        persistContentState();
        return ResponseEntity.ok(siteBranding);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/audit-logs")
    public ResponseEntity<List<Map<String, Object>>> getAuditLogs() {
        List<Map<String, Object>> logs = new ArrayList<>();
        Map<String, Object> l1 = new LinkedHashMap<>();
        l1.put("id", "audit-" + System.currentTimeMillis());
        l1.put("action", "SETTINGS_UPDATED");
        l1.put("details", "Website branding, dot color, and header configuration synced.");
        l1.put("actor", "admin@apex.com");
        l1.put("timestamp", Instant.now().toString());
        logs.add(l1);
        return ResponseEntity.ok(logs);
    }

    // --- ICONS REPOSITORY CRUD (SYSTEM & CUSTOM) ---
    @GetMapping("/icons")
    public ResponseEntity<List<Icon>> getIcons() {
        return ResponseEntity.ok(iconRepository.findAll());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/icons")
    public ResponseEntity<Icon> addIcon(@RequestBody Map<String, Object> body) {
        String name = (String) body.getOrDefault("name", "Custom Icon");
        String iconType = (String) body.getOrDefault("iconType", "CUSTOM");
        String iconValue = (String) body.get("iconValue");
        if (iconValue == null || iconValue.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Icon icon = Icon.builder()
                .name(name)
                .iconType(iconType)
                .iconValue(iconValue)
                .build();
        Icon saved = iconRepository.save(icon);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // --- CATEGORIES CRUD WITH ICON RELATIONSHIP ---
    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, Object>>> getCategories() {
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
        return ResponseEntity.ok(result);
    }

    private ServiceCategoryDto toServiceCategoryDto(Category c) {
        long partnerCount = categoryRepository.countPartnersByCategoryId(c.getId());
        long requestCount = categoryRepository.countRequestsByCategoryIdAndName(c.getId(), c.getName());
        return ServiceCategoryDto.builder()
                .id(c.getId())
                .name(c.getName())
                .slug(c.getSlug())
                .description(c.getDescription())
                .tag(c.getTag())
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

    private Icon resolveIcon(CategoryRequestDto body, String categoryName) {
        if (body.getCustomIconValue() != null && !body.getCustomIconValue().isBlank()) {
            String customValue = body.getCustomIconValue();
            String iconName = body.getCustomIconName() != null && !body.getCustomIconName().isBlank()
                    ? InputSanitizer.sanitize(body.getCustomIconName())
                    : categoryName + " Icon";
            Icon icon = Icon.builder()
                    .name(iconName)
                    .iconType("CUSTOM")
                    .iconValue(customValue)
                    .build();
            return iconRepository.save(icon);
        } else if (body.getIconId() != null) {
            try {
                return iconRepository.findById(body.getIconId()).orElse(null);
            } catch (Exception ignored) {
                return null;
            }
        } else if (body.getIconName() != null && !body.getIconName().isBlank()) {
            String iconName = InputSanitizer.sanitize(body.getIconName());
            return iconRepository.findByIconValue(iconName)
                    .orElseGet(() -> iconRepository.save(Icon.builder().name(iconName).iconType("SYSTEM").iconValue(iconName).build()));
        }
        return null;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/service-categories")
    public ResponseEntity<List<ServiceCategoryDto>> getAdminServiceCategories(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active) {
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
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/service-categories")
    public ResponseEntity<?> createAdminServiceCategory(@Valid @RequestBody CategoryRequestDto body) {
        String name = InputSanitizer.sanitize(body.getName());
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "A service category with this name already exists."));
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

        Icon icon = resolveIcon(body, name);

        Category cat = Category.builder()
                .name(name)
                .slug(slug)
                .description(description)
                .tag(tag)
                .active(active)
                .icon(icon)
                .build();

        Category saved = categoryRepository.save(cat);
        return ResponseEntity.status(HttpStatus.CREATED).body(toServiceCategoryDto(saved));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/service-categories/{id}")
    public ResponseEntity<?> updateAdminServiceCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequestDto body) {
        Category category = categoryRepository.findById(id).orElse(null);
        if (category == null) {
            return ResponseEntity.notFound().build();
        }

        String name = InputSanitizer.sanitize(body.getName());
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Another category already exists with the name: " + name));
        }

        String slug = body.getSlug() != null && !body.getSlug().isBlank()
                ? InputSanitizer.sanitize(body.getSlug()).toLowerCase().replaceAll("[^a-z0-9]+", "-")
                : name.trim().toLowerCase().replaceAll("[^a-z0-9]+", "-");

        if (categoryRepository.existsBySlugAndIdNot(slug, id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Another category already uses the slug: " + slug));
        }

        category.setName(name);
        category.setSlug(slug);
        if (body.getDescription() != null) category.setDescription(InputSanitizer.sanitize(body.getDescription()));
        if (body.getTag() != null) category.setTag(InputSanitizer.sanitize(body.getTag()));
        if (body.getActive() != null) category.setActive(body.getActive());

        Icon icon = resolveIcon(body, name);
        if (icon != null) {
            category.setIcon(icon);
        }

        Category saved = categoryRepository.save(category);
        return ResponseEntity.ok(toServiceCategoryDto(saved));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping({"/admin/service-categories/{id}/status", "/categories/{id}/status"})
    public ResponseEntity<?> toggleCategoryStatus(@PathVariable Long id, @RequestBody(required = false) CategoryStatusRequest req) {
        Category category = categoryRepository.findById(id).orElse(null);
        if (category == null) {
            return ResponseEntity.notFound().build();
        }
        boolean newStatus = (req != null && req.getActive() != null) ? req.getActive() : !category.isActive();
        category.setActive(newStatus);
        Category saved = categoryRepository.save(category);
        return ResponseEntity.ok(toServiceCategoryDto(saved));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/categories")
    public ResponseEntity<Map<String, Object>> addCategory(@Valid @RequestBody CategoryRequestDto body) {
        String name = InputSanitizer.sanitize(body.getName());
        String description = InputSanitizer.sanitize(body.getDescription());
        String tag = body.getTag() != null && !body.getTag().isBlank() ? InputSanitizer.sanitize(body.getTag()) : "Popular";

        Icon icon = null;
        // Case 1: Custom Icon uploaded (Base64 / URL)
        if (body.getCustomIconValue() != null && !body.getCustomIconValue().isBlank()) {
            String customValue = body.getCustomIconValue();
            String iconName = body.getCustomIconName() != null && !body.getCustomIconName().isBlank()
                    ? InputSanitizer.sanitize(body.getCustomIconName())
                    : name + " Icon";
            icon = Icon.builder()
                    .name(iconName)
                    .iconType("CUSTOM")
                    .iconValue(customValue)
                    .build();
            icon = iconRepository.save(icon);
        }
        // Case 2: Selected from existing icon library via iconId
        else if (body.getIconId() != null) {
            try {
                icon = iconRepository.findById(body.getIconId()).orElse(null);
            } catch (Exception ignored) {}
        }
        // Case 3: Provided by iconName (Lucide icon identifier)
        else if (body.getIconName() != null && !body.getIconName().isBlank()) {
            String iconName = InputSanitizer.sanitize(body.getIconName());
            icon = iconRepository.findByIconValue(iconName)
                    .orElseGet(() -> iconRepository.save(Icon.builder().name(iconName).iconType("SYSTEM").iconValue(iconName).build()));
        }

        Category category = Category.builder()
                .name(name)
                .description(description)
                .tag(tag)
                .icon(icon)
                .build();
        Category saved = categoryRepository.save(category);

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", saved.getId());
        map.put("name", saved.getName());
        map.put("description", saved.getDescription());
        map.put("tag", saved.getTag());
        if (saved.getIcon() != null) {
            map.put("iconId", saved.getIcon().getId());
            map.put("iconName", saved.getIcon().getIconValue());
            map.put("icon", saved.getIcon());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(map);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/categories/{id}")
    public ResponseEntity<Map<String, Object>> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequestDto body) {
        Category category = categoryRepository.findById(id).orElse(null);
        if (category == null) {
            return ResponseEntity.notFound().build();
        }

        if (body.getName() != null) category.setName(InputSanitizer.sanitize(body.getName()));
        if (body.getDescription() != null) category.setDescription(InputSanitizer.sanitize(body.getDescription()));
        if (body.getTag() != null) category.setTag(InputSanitizer.sanitize(body.getTag()));

        // Update Icon if provided
        if (body.getCustomIconValue() != null && !body.getCustomIconValue().isBlank()) {
            String customValue = body.getCustomIconValue();
            String iconName = body.getCustomIconName() != null && !body.getCustomIconName().isBlank()
                    ? InputSanitizer.sanitize(body.getCustomIconName())
                    : category.getName() + " Icon";
            Icon newIcon = Icon.builder()
                    .name(iconName)
                    .iconType("CUSTOM")
                    .iconValue(customValue)
                    .build();
            newIcon = iconRepository.save(newIcon);
            category.setIcon(newIcon);
        } else if (body.getIconId() != null) {
            try {
                iconRepository.findById(body.getIconId()).ifPresent(category::setIcon);
            } catch (Exception ignored) {}
        } else if (body.getIconName() != null && !body.getIconName().isBlank()) {
            String iconName = InputSanitizer.sanitize(body.getIconName());
            Icon matched = iconRepository.findByIconValue(iconName)
                    .orElseGet(() -> iconRepository.save(Icon.builder().name(iconName).iconType("SYSTEM").iconValue(iconName).build()));
            category.setIcon(matched);
        }

        Category saved = categoryRepository.save(category);

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", saved.getId());
        map.put("name", saved.getName());
        map.put("description", saved.getDescription());
        map.put("tag", saved.getTag());
        if (saved.getIcon() != null) {
            map.put("iconId", saved.getIcon().getId());
            map.put("iconName", saved.getIcon().getIconValue());
            map.put("icon", saved.getIcon());
        }
        return ResponseEntity.ok(map);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping({"/admin/service-categories/{id}", "/categories/{id}"})
    public ResponseEntity<?> deleteCategory(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "false") boolean permanent) {
        Category category = categoryRepository.findById(id).orElse(null);
        if (category == null) {
            return ResponseEntity.notFound().build();
        }
        if (permanent) {
            categoryRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Category permanently deleted", "id", id));
        } else {
            category.setActive(false);
            Category saved = categoryRepository.save(category);
            return ResponseEntity.ok(toServiceCategoryDto(saved));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping({"/admin/service-categories/{id}/restore", "/categories/{id}/restore"})
    public ResponseEntity<?> restoreCategory(@PathVariable Long id) {
        Category category = categoryRepository.findById(id).orElse(null);
        if (category == null) {
            return ResponseEntity.notFound().build();
        }
        category.setActive(true);
        Category saved = categoryRepository.save(category);
        return ResponseEntity.ok(toServiceCategoryDto(saved));
    }

    // --- SLIDES CRUD ---
    @GetMapping({"/slides", "/admin/slides"})
    public ResponseEntity<List<Map<String, Object>>> getSlides() {
        return ResponseEntity.ok(heroSlides);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping({"/slides", "/admin/slides"})
    public ResponseEntity<Map<String, Object>> addSlide(@RequestBody Map<String, Object> slide) {
        if (!slide.containsKey("id") || slide.get("id") == null) {
            slide.put("id", "slide-" + System.currentTimeMillis());
        }
        heroSlides.add(slide);
        persistContentState();
        return ResponseEntity.status(HttpStatus.CREATED).body(slide);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping({"/slides/{id}", "/admin/slides/{id}"})
    public ResponseEntity<Map<String, Object>> updateSlide(@PathVariable String id, @RequestBody Map<String, Object> slide) {
        for (int i = 0; i < heroSlides.size(); i++) {
            if (id.equals(heroSlides.get(i).get("id"))) {
                slide.put("id", id);
                heroSlides.set(i, slide);
                persistContentState();
                return ResponseEntity.ok(slide);
            }
        }
        slide.put("id", id);
        heroSlides.add(slide);
        persistContentState();
        return ResponseEntity.ok(slide);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping({"/slides/{id}", "/admin/slides/{id}"})
    public ResponseEntity<Void> deleteSlide(@PathVariable String id) {
        heroSlides.removeIf(s -> id.equals(s.get("id")));
        persistContentState();
        return ResponseEntity.noContent().build();
    }

    // --- AI OWNER ---
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping({"/ai-owner", "/admin/ai-owner"})
    public ResponseEntity<Map<String, Object>> updateAiOwner(@RequestBody Map<String, Object> owner) {
        aiOwnerSection.putAll(owner);
        persistContentState();
        return ResponseEntity.ok(aiOwnerSection);
    }

    // --- REVIEWS CRUD ---
    @GetMapping({"/reviews", "/admin/reviews"})
    public ResponseEntity<List<Map<String, Object>>> getReviews() {
        return ResponseEntity.ok(reviews);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping({"/reviews", "/admin/reviews"})
    public ResponseEntity<Map<String, Object>> addReview(@RequestBody Map<String, Object> review) {
        if (!review.containsKey("id") || review.get("id") == null) {
            review.put("id", "rev-" + System.currentTimeMillis());
        }
        reviews.add(review);
        persistContentState();
        return ResponseEntity.status(HttpStatus.CREATED).body(review);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping({"/reviews/{id}", "/admin/reviews/{id}"})
    public ResponseEntity<Void> deleteReview(@PathVariable String id) {
        reviews.removeIf(r -> id.equals(r.get("id")));
        persistContentState();
        return ResponseEntity.noContent().build();
    }

    // --- ANNOUNCEMENT ---
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping({"/announcement", "/admin/announcement"})
    public ResponseEntity<Map<String, Object>> updateAnnouncement(@RequestBody Map<String, Object> ann) {
        announcement.putAll(ann);
        persistContentState();
        return ResponseEntity.ok(announcement);
    }

    // --- WORK REQUESTS ---
    @GetMapping("/work-requests")
    public ResponseEntity<List<WorkRequestResponseDto>> getWorkRequests(@RequestParam(required = false) String email) {
        if (email != null && (!InputSanitizer.isSqlSafe(email) || !InputSanitizer.isXssSafe(email))) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(workRequestService.getWorkRequests(email));
    }

    @PostMapping("/work-requests")
    public ResponseEntity<WorkRequestResponseDto> createWorkRequest(
            @Valid @RequestBody WorkRequestDto requestDto,
            Principal principal) {
        String authEmail = principal != null ? principal.getName() : null;
        WorkRequestResponseDto created = workRequestService.createWorkRequest(requestDto, authEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/work-requests/{id}")
    public ResponseEntity<WorkRequestResponseDto> getWorkRequestById(@PathVariable String id) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(workRequestService.getWorkRequestById(id));
    }

    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    @GetMapping({"/work-requests/partner-feed", "/work-requests/partner/feed"})
    public ResponseEntity<List<WorkRequestResponseDto>> getPartnerFeed(
            @RequestParam(required = false) String category,
            Principal principal) {
        String partnerEmail = principal.getName();
        return ResponseEntity.ok(workRequestService.getPartnerFeed(partnerEmail, category));
    }

    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    @PostMapping("/work-requests/{id}/claim")
    public ResponseEntity<WorkRequestClaimResponseDto> claimWorkRequest(
            @PathVariable String id,
            Principal principal) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        String partnerEmail = principal.getName();
        WorkRequestClaimResponseDto result = workRequestService.claimWorkRequest(id, partnerEmail);
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    @PostMapping("/work-requests/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectWorkRequest(
            @PathVariable String id,
            Principal principal) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        String partnerEmail = principal.getName();
        return ResponseEntity.ok(workRequestService.rejectWorkRequest(id, partnerEmail));
    }

    @PostMapping("/work-requests/{id}/advance-stage")
    public ResponseEntity<WorkRequestResponseDto> advanceWorkRequestStage(
            @PathVariable String id,
            Principal principal) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        String userEmail = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(workRequestService.advanceStage(id, userEmail));
    }

    @PostMapping("/work-requests/{id}/verify-completion")
    public ResponseEntity<WorkRequestResponseDto> verifyWorkRequestCompletion(
            @PathVariable String id,
            @RequestBody Map<String, String> payload,
            Principal principal) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        String otp = payload != null ? payload.get("completionOtp") : null;
        if (otp == null || otp.isBlank()) {
            otp = payload != null ? payload.get("otp") : null;
        }
        String partnerEmail = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(workRequestService.verifyCompletion(id, partnerEmail, otp));
    }

    @GetMapping("/work-requests/{id}/completion-otp")
    public ResponseEntity<Map<String, String>> getCustomerCompletionOtp(
            @PathVariable String id,
            Principal principal) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        String customerEmail = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(workRequestService.getCustomerCompletionOtp(id, customerEmail));
    }

    @PostMapping("/work-requests/{id}/review")
    public ResponseEntity<com.apexservices.model.Review> submitReview(
            @PathVariable String id,
            @RequestBody Map<String, Object> payload,
            Principal principal) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        int rating = payload.get("rating") != null ? Integer.parseInt(String.valueOf(payload.get("rating"))) : 5;
        String reviewText = payload.get("review") != null ? String.valueOf(payload.get("review"))
                : (payload.get("reviewText") != null ? String.valueOf(payload.get("reviewText")) : "");
        String customerEmail = principal != null ? principal.getName() : null;
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.submitReview(id, rating, reviewText, customerEmail));
    }

    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    @PostMapping(value = "/partners/profile/avatar", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadPartnerAvatar(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            Principal principal) {
        com.apexservices.model.User partner = userRepository.findByEmail(principal.getName().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Partner account not found"));
        String avatarUrl = partnerProfileService.uploadAvatar(partner.getId(), file);
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("avatarUrl", avatarUrl);
        return ResponseEntity.ok(res);
    }

    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    @GetMapping("/partners/profile")
    public ResponseEntity<com.apexservices.model.PartnerProfile> getPartnerProfile(Principal principal) {
        com.apexservices.model.User partner = userRepository.findByEmail(principal.getName().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Partner account not found"));
        return ResponseEntity.ok(partnerProfileService.getOrCreatePartnerProfile(partner.getId()));
    }

    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    @PutMapping("/partners/profile")
    public ResponseEntity<com.apexservices.model.PartnerProfile> updatePartnerProfile(
            @RequestBody Map<String, Object> updates,
            Principal principal) {
        com.apexservices.model.User partner = userRepository.findByEmail(principal.getName().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Partner account not found"));
        return ResponseEntity.ok(partnerProfileService.updateProfile(partner.getId(), updates));
    }

    @GetMapping("/public/avatars/{fileName:.+}")
    public ResponseEntity<org.springframework.core.io.Resource> getAvatarFile(@PathVariable String fileName) {
        if (!InputSanitizer.isSqlSafe(fileName) || fileName.contains("..")) {
            return ResponseEntity.badRequest().build();
        }
        try {
            java.nio.file.Path filePath = java.nio.file.Paths.get("uploads/avatars").resolve(fileName).normalize();
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                String contentType = java.nio.file.Files.probeContentType(filePath);
                return ResponseEntity.ok()
                        .contentType(org.springframework.http.MediaType.parseMediaType(contentType != null ? contentType : "image/jpeg"))
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/work-requests/{id}/cancel")
    public ResponseEntity<WorkRequestResponseDto> cancelWorkRequest(
            @PathVariable String id,
            Principal principal) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        String userEmail = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(workRequestService.cancelWorkRequest(id, userEmail));
    }

    @PostMapping("/work-requests/{id}/pay")
    public ResponseEntity<WorkRequestResponseDto> payWorkRequest(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> payload,
            Principal principal) {
        if (!InputSanitizer.isSqlSafe(id)) {
            return ResponseEntity.badRequest().build();
        }
        String method = payload != null && payload.get("method") != null ? String.valueOf(payload.get("method")) : "UPI";
        String userEmail = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(workRequestService.processPayment(id, method, userEmail));
    }

    @PreAuthorize("hasAnyRole('PARTNER', 'ADMIN')")
    @PostMapping("/partners/availability")
    public ResponseEntity<Map<String, Object>> updatePartnerAvailability(
            @RequestBody Map<String, Object> payload,
            Principal principal) {
        boolean available = Boolean.parseBoolean(String.valueOf(payload.getOrDefault("available", "true")));
        boolean online = Boolean.parseBoolean(String.valueOf(payload.getOrDefault("online", "true")));
        String category = String.valueOf(payload.getOrDefault("category", "All"));

        presenceService.updatePresence(0L, principal.getName(), online, available, category);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("online", online);
        res.put("available", available);
        res.put("category", category);
        return ResponseEntity.ok(res);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/work-requests")
    public ResponseEntity<List<WorkRequestResponseDto>> getAdminWorkRequests() {
        return ResponseEntity.ok(workRequestService.getWorkRequests(null));
    }
}
