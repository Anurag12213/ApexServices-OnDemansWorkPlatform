package com.apexservices.service;

import com.apexservices.model.PartnerProfile;
import com.apexservices.model.User;
import com.apexservices.repository.PartnerProfileRepository;
import com.apexservices.repository.UserRepository;
import com.apexservices.repository.WorkRequestRepository;
import com.apexservices.service.media.MediaStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.InputStream;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Tests - PartnerProfileService Cloud Avatar Storage & Propagation")
class PartnerProfileServiceAvatarTest {

    @Mock
    private PartnerProfileRepository profileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ReviewService reviewService;

    @Mock
    private WorkRequestRepository workRequestRepository;

    @Mock
    private MediaStorageService mediaStorageService;

    private PartnerProfileService profileService;

    @BeforeEach
    void setUp() {
        profileService = new PartnerProfileService(
                profileRepository,
                userRepository,
                reviewService,
                workRequestRepository,
                mediaStorageService
        );
    }

    @Test
    @DisplayName("Should upload avatar via MediaStorageService and propagate to work requests")
    void testUploadAvatarDelegatesToMediaStorageAndPropagates() {
        Long partnerId = 42L;
        User user = User.builder().id(partnerId).fullName("Bob The Builder").email("bob@builder.com").build();
        PartnerProfile profile = PartnerProfile.builder().userId(partnerId).user(user).build();

        when(profileRepository.findByUserId(partnerId)).thenReturn(Optional.of(profile));
        when(mediaStorageService.uploadImage(any(InputStream.class), anyString(), eq("image/png"), eq("avatars")))
                .thenReturn("https://res.cloudinary.com/apex/image/upload/avatars/partner_42.webp");
        when(profileRepository.save(any(PartnerProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MockMultipartFile avatarFile = new MockMultipartFile(
                "file",
                "avatar.png",
                "image/png",
                "dummy-png-bytes".getBytes()
        );

        String resultUrl = profileService.uploadAvatar(partnerId, avatarFile);

        assertNotNull(resultUrl);
        assertEquals("https://res.cloudinary.com/apex/image/upload/avatars/partner_42.webp", resultUrl);

        // Verify avatarKey was updated in profile
        ArgumentCaptor<PartnerProfile> captor = ArgumentCaptor.forClass(PartnerProfile.class);
        verify(profileRepository).save(captor.capture());
        assertEquals(resultUrl, captor.getValue().getAvatarKey());

        // Verify dynamic propagation to work requests
        verify(workRequestRepository).updateAssignedPartnerPhotoForPartner(partnerId, resultUrl);
    }

    @Test
    @DisplayName("Should reject invalid file type for avatar upload")
    void testRejectInvalidAvatarMimeType() {
        Long partnerId = 42L;
        MockMultipartFile invalidFile = new MockMultipartFile(
                "file",
                "script.sh",
                "application/x-sh",
                "echo bad".getBytes()
        );

        assertThrows(IllegalArgumentException.class, () -> profileService.uploadAvatar(partnerId, invalidFile));
        verify(mediaStorageService, never()).uploadImage(any(InputStream.class), anyString(), anyString(), anyString());
    }
}
