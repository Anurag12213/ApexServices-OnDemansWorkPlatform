package com.apexservices.service;

import com.apexservices.dto.BootstrapDataResponseDto;
import com.apexservices.model.SiteSetting;
import com.apexservices.repository.SiteSettingRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class SiteContentService {

    private final SiteSettingRepository siteSettingRepository;
    private final ContentVersionService contentVersionService;
    private final PlatformConfigService platformConfigService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Map<String, Object> siteBranding = new ConcurrentHashMap<>();
    private final Map<String, Object> announcement = new ConcurrentHashMap<>();
    private final Map<String, Object> aiOwnerSection = new ConcurrentHashMap<>();
    private final List<Map<String, Object>> heroSlides = new CopyOnWriteArrayList<>();
    private final List<Map<String, Object>> reviews = new CopyOnWriteArrayList<>();

    @PostConstruct
    public void init() {
        initDefaultData();
        loadPersistedContentState();
    }

    public void bumpContentVersion() {
        if (contentVersionService != null) {
            contentVersionService.bumpVersion();
        }
    }

    @SuppressWarnings("unchecked")
    public synchronized void persistContentState() {
        try {
            if (siteSettingRepository != null) {
                siteSettingRepository.save(new SiteSetting("siteBranding", objectMapper.writeValueAsString(siteBranding)));
                siteSettingRepository.save(new SiteSetting("announcement", objectMapper.writeValueAsString(announcement)));
                siteSettingRepository.save(new SiteSetting("aiOwnerSection", objectMapper.writeValueAsString(aiOwnerSection)));
                siteSettingRepository.save(new SiteSetting("heroSlides", objectMapper.writeValueAsString(heroSlides)));
                siteSettingRepository.save(new SiteSetting("reviews", objectMapper.writeValueAsString(reviews)));
                log.info("Site content state successfully saved to MySQL database (brandName={}).", siteBranding.get("brandName"));
            }
        } catch (Exception e) {
            log.warn("Failed to persist site content state to database: {}", e.getMessage());
        }

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
        bumpContentVersion();
    }

    @SuppressWarnings("unchecked")
    public synchronized void loadPersistedContentState() {
        boolean loadedFromDb = false;
        try {
            if (siteSettingRepository != null) {
                Optional<SiteSetting> brandingOpt = siteSettingRepository.findById("siteBranding");
                if (brandingOpt.isPresent() && brandingOpt.get().getValue() != null) {
                    Map<String, Object> m = objectMapper.readValue(brandingOpt.get().getValue(), Map.class);
                    siteBranding.putAll(m);
                    loadedFromDb = true;
                }
                Optional<SiteSetting> annOpt = siteSettingRepository.findById("announcement");
                if (annOpt.isPresent() && annOpt.get().getValue() != null) {
                    Map<String, Object> m = objectMapper.readValue(annOpt.get().getValue(), Map.class);
                    announcement.putAll(m);
                }
                Optional<SiteSetting> aiOpt = siteSettingRepository.findById("aiOwnerSection");
                if (aiOpt.isPresent() && aiOpt.get().getValue() != null) {
                    Map<String, Object> m = objectMapper.readValue(aiOpt.get().getValue(), Map.class);
                    aiOwnerSection.putAll(m);
                }
                Optional<SiteSetting> slidesOpt = siteSettingRepository.findById("heroSlides");
                if (slidesOpt.isPresent() && slidesOpt.get().getValue() != null) {
                    List<Map<String, Object>> l = objectMapper.readValue(slidesOpt.get().getValue(), List.class);
                    if (!l.isEmpty()) {
                        heroSlides.clear();
                        heroSlides.addAll(l);
                    }
                }
                Optional<SiteSetting> revOpt = siteSettingRepository.findById("reviews");
                if (revOpt.isPresent() && revOpt.get().getValue() != null) {
                    List<Map<String, Object>> l = objectMapper.readValue(revOpt.get().getValue(), List.class);
                    if (!l.isEmpty()) {
                        reviews.clear();
                        reviews.addAll(l);
                    }
                }
                if (loadedFromDb) {
                    log.info("Loaded site branding from MySQL database: brandName={}", siteBranding.get("brandName"));
                }
            }
        } catch (Exception e) {
            log.warn("Database content settings load failed, falling back to disk: {}", e.getMessage());
        }

        if (!loadedFromDb) {
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
    }

    private void initDefaultData() {
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

        announcement.put("enabled", true);
        announcement.put("text", "🔥 Seasonal Offer: Get 20% OFF on all Carpentry, Plumbing & AC Services this week! Use Code: APEX20");

        aiOwnerSection.put("ownerName", "Anurag Vijaywargiy");
        aiOwnerSection.put("ownerTitle", "Founder & Master Operations Director");
        aiOwnerSection.put("badge", "FOUNDER'S DIRECT GUARANTEE");
        aiOwnerSection.put("headingText", "Your Peace of Mind is Our Top Priority!");
        aiOwnerSection.put("indicatedText", "We personally guarantee top-quality workmanship on every job. If you're not 100% satisfied with our carpentry, plumbing, or electrical repair, we'll fix it completely free of charge!");
        aiOwnerSection.put("buttonText", "REQUEST NOW");
        aiOwnerSection.put("imageUrl", "/anurag_founder.jpg");

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

        addReviewDirect("rev-1", "Sarah Jenkins", "Homeowner", 5, "The carpentry team redesigned our custom kitchen cabinets flawlessly! Fast, polite, and very clean work.", "Custom Carpentry", "2 days ago", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80");
        addReviewDirect("rev-2", "David Miller", "Property Manager", 5, "Called their emergency plumbing team at 11 PM for a burst pipe. They arrived in 25 minutes and fixed it completely!", "Emergency Plumbing", "1 week ago", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80");
        addReviewDirect("rev-3", "Elena Rostova", "Interior Designer", 5, "Outstanding electrical and lighting installation. Their attention to safety and detail is unmatched in the area.", "Electrical Maintenance", "3 weeks ago", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80");
    }

    private void addReviewDirect(String id, String name, String role, int rating, String comment, String serviceUsed, String date, String avatar) {
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

    public BootstrapDataResponseDto buildBootstrapDto(List<Map<String, Object>> categories) {
        Map<String, Object> lightPublicConfig = new LinkedHashMap<>(siteBranding);
        lightPublicConfig.remove("categoryImages");
        lightPublicConfig.remove("logoImageUrl");

        if (platformConfigService != null) {
            Map<String, Object> maint = platformConfigService.getMaintenanceStatus("customer_web");
            lightPublicConfig.put("maintenance", maint);
            lightPublicConfig.put("featureFlags", platformConfigService.getPublicFlagsMap());
            platformConfigService.getVersionByClient("customer_web").ifPresent(v -> {
                lightPublicConfig.put("minRequiredVersion", v.getMinRequiredVersion());
                lightPublicConfig.put("latestVersion", v.getCurrentVersion());
                lightPublicConfig.put("forceUpdateEnabled", v.isForceUpdateEnabled());
            });
        }

        return BootstrapDataResponseDto.builder()
                .announcement(announcement)
                .heroSlides(heroSlides)
                .aiOwnerSection(aiOwnerSection)
                .categories(categories)
                .reviews(reviews)
                .siteBranding(siteBranding)
                .publicConfig(lightPublicConfig)
                .version(String.valueOf(contentVersionService.getVersion()))
                .timestamp(System.currentTimeMillis())
                .build();
    }

    public Map<String, Object> buildModularConfig() {
        Map<String, Object> cfg = new LinkedHashMap<>();
        cfg.put("announcement", announcement);
        cfg.put("siteBranding", siteBranding);
        cfg.put("aiOwnerSection", aiOwnerSection);
        if (platformConfigService != null) {
            cfg.put("maintenance", platformConfigService.getMaintenanceStatus("customer_web"));
            cfg.put("featureFlags", platformConfigService.getPublicFlagsMap());
        }
        return cfg;
    }

    public Map<String, Object> getSettings() {
        return siteBranding;
    }

    public Map<String, Object> updateSettings(Map<String, Object> updates) {
        siteBranding.putAll(updates);
        persistContentState();
        return siteBranding;
    }

    public List<Map<String, Object>> getSlides() {
        return heroSlides;
    }

    public Map<String, Object> addSlide(Map<String, Object> slide) {
        if (!slide.containsKey("id") || slide.get("id") == null) {
            slide.put("id", "slide-" + System.currentTimeMillis());
        }
        heroSlides.add(slide);
        persistContentState();
        return slide;
    }

    public Map<String, Object> updateSlide(String id, Map<String, Object> slide) {
        for (int i = 0; i < heroSlides.size(); i++) {
            if (id.equals(heroSlides.get(i).get("id"))) {
                slide.put("id", id);
                heroSlides.set(i, slide);
                persistContentState();
                return slide;
            }
        }
        slide.put("id", id);
        heroSlides.add(slide);
        persistContentState();
        return slide;
    }

    public void deleteSlide(String id) {
        heroSlides.removeIf(s -> id.equals(s.get("id")));
        persistContentState();
    }

    public Map<String, Object> updateAiOwner(Map<String, Object> owner) {
        aiOwnerSection.putAll(owner);
        persistContentState();
        return aiOwnerSection;
    }

    public List<Map<String, Object>> getReviews() {
        return reviews;
    }

    public Map<String, Object> addReview(Map<String, Object> review) {
        if (!review.containsKey("id") || review.get("id") == null) {
            review.put("id", "rev-" + System.currentTimeMillis());
        }
        reviews.add(review);
        persistContentState();
        return review;
    }

    public void deleteReview(String id) {
        reviews.removeIf(r -> id.equals(r.get("id")));
        persistContentState();
    }

    public Map<String, Object> updateAnnouncement(Map<String, Object> ann) {
        announcement.putAll(ann);
        persistContentState();
        return announcement;
    }
}
