package com.apexservices.service;

import com.apexservices.model.PartnerProfile;
import com.apexservices.model.User;
import com.apexservices.repository.PartnerProfileRepository;
import com.apexservices.repository.UserRepository;
import com.apexservices.security.InputSanitizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class PartnerProfileService {

    private static final Logger log = LoggerFactory.getLogger(PartnerProfileService.class);
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/jpg");
    private static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    private static final String UPLOAD_DIR = "uploads/avatars";

    private final PartnerProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final ReviewService reviewService;
    private final com.apexservices.repository.WorkRequestRepository workRequestRepository;

    public PartnerProfileService(
            PartnerProfileRepository profileRepository,
            UserRepository userRepository,
            ReviewService reviewService,
            com.apexservices.repository.WorkRequestRepository workRequestRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.reviewService = reviewService;
        this.workRequestRepository = workRequestRepository;
    }

    public String getPartnerAvatarUrl(Long partnerId) {
        if (partnerId == null) return null;
        return profileRepository.findByUserId(partnerId)
                .map(PartnerProfile::getAvatarKey)
                .filter(key -> key != null && !key.isBlank())
                .orElse(null);
    }

    public PartnerProfile getOrCreatePartnerProfile(Long partnerId) {
        return profileRepository.findByUserId(partnerId)
                .orElseGet(() -> {
                    User partner = userRepository.findById(partnerId)
                            .orElseThrow(() -> new IllegalArgumentException("Partner account not found: " + partnerId));
                    PartnerProfile newProfile = PartnerProfile.builder()
                            .user(partner)
                            .operatingTerritory("Central Territory (15 km)")
                            .idVerificationStatus("VERIFIED")
                            .backgroundVerificationStatus("VERIFIED")
                            .trainingVerificationStatus("VERIFIED")
                            .rating(new BigDecimal("5.00"))
                            .reviewCount(0)
                            .build();
                    return profileRepository.save(newProfile);
                });
    }

    /**
     * Uploads and stores partner avatar photo with strict validation.
     */
    @Transactional
    public String uploadAvatar(Long partnerId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size exceeds 5MB limit");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Unsupported image format. Allowed formats: JPG, PNG, WEBP");
        }

        PartnerProfile profile = getOrCreatePartnerProfile(partnerId);

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String ext = contentType.contains("png") ? "png" : (contentType.contains("webp") ? "webp" : "jpg");
            String safeFileName = "partner_" + partnerId + "_" + UUID.randomUUID().toString().substring(0, 8) + "." + ext;
            Path targetLocation = uploadPath.resolve(safeFileName);

            try (InputStream is = file.getInputStream()) {
                Files.copy(is, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }

            String avatarUrl = "/api/public/avatars/" + safeFileName;
            profile.setAvatarKey(avatarUrl);
            profileRepository.save(profile);

            // Dynamically propagate the new avatar to all assigned work requests for this partner
            try {
                workRequestRepository.updateAssignedPartnerPhotoForPartner(partnerId, avatarUrl);
            } catch (Exception e) {
                log.warn("Failed to propagate avatar update to work requests: {}", e.getMessage());
            }

            log.info("Uploaded avatar for partnerId: {} -> {}", partnerId, avatarUrl);
            return avatarUrl;
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store uploaded avatar file", e);
        }
    }

    /**
     * Updates approved editable profile fields.
     * Prevents modification of verification badges, ratings, roles.
     */
    @Transactional
    public PartnerProfile updateProfile(Long partnerId, Map<String, Object> updates) {
        PartnerProfile profile = getOrCreatePartnerProfile(partnerId);
        User user = profile.getUser();

        if (updates.containsKey("fullName") && updates.get("fullName") != null) {
            user.setFullName(InputSanitizer.sanitize(String.valueOf(updates.get("fullName")).trim()));
        }
        if (updates.containsKey("phone") && updates.get("phone") != null) {
            user.setMobileNumber(InputSanitizer.sanitize(String.valueOf(updates.get("phone")).trim()));
        }
        if (updates.containsKey("operatingTerritory") && updates.get("operatingTerritory") != null) {
            profile.setOperatingTerritory(InputSanitizer.sanitize(String.valueOf(updates.get("operatingTerritory")).trim()));
        }
        if (updates.containsKey("avatarUrl") && updates.get("avatarUrl") != null) {
            String avatarUrl = String.valueOf(updates.get("avatarUrl")).trim();
            profile.setAvatarKey(avatarUrl);
            try {
                workRequestRepository.updateAssignedPartnerPhotoForPartner(partnerId, avatarUrl);
            } catch (Exception e) {
                log.warn("Failed to propagate avatarUrl to work requests: {}", e.getMessage());
            }
        }

        userRepository.save(user);
        return profileRepository.save(profile);
    }
}
