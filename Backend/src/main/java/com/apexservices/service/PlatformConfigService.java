package com.apexservices.service;

import com.apexservices.model.AppVersion;
import com.apexservices.model.PlatformFeatureFlag;
import com.apexservices.repository.AppVersionRepository;
import com.apexservices.repository.PlatformFeatureFlagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlatformConfigService {

    private final PlatformFeatureFlagRepository featureFlagRepository;
    private final AppVersionRepository appVersionRepository;
    private final AuditLogService auditLogService;

    public List<PlatformFeatureFlag> getAllFlags() {
        return featureFlagRepository.findAll();
    }

    public Map<String, Boolean> getPublicFlagsMap() {
        List<PlatformFeatureFlag> flags = featureFlagRepository.findByIsPublicTrue();
        Map<String, Boolean> map = new HashMap<>();
        for (PlatformFeatureFlag f : flags) {
            map.put(f.getFlagKey(), f.isEnabled());
        }
        return map;
    }

    @Transactional
    public PlatformFeatureFlag setFlagStatus(String flagKey, boolean enabled, String actor) {
        PlatformFeatureFlag flag = featureFlagRepository.findById(flagKey)
                .orElseGet(() -> PlatformFeatureFlag.builder()
                        .flagKey(flagKey)
                        .flagName(flagKey)
                        .category("CUSTOM")
                        .isPublic(true)
                        .build()
                );

        flag.setEnabled(enabled);
        PlatformFeatureFlag saved = featureFlagRepository.save(flag);

        auditLogService.record(
                actor != null ? actor : "ADMIN",
                "ADMIN",
                "FEATURE_FLAG_TOGGLED",
                "CONFIG",
                flagKey,
                "Feature flag " + flagKey + " set to " + enabled,
                "127.0.0.1"
        );

        return saved;
    }

    public List<AppVersion> getAllVersions() {
        return appVersionRepository.findAll();
    }

    public Optional<AppVersion> getVersionByClient(String clientType) {
        return appVersionRepository.findById(clientType);
    }

    @Transactional
    public AppVersion updateVersionInfo(String clientType, AppVersion updateReq, String actor) {
        AppVersion current = appVersionRepository.findById(clientType)
                .orElseGet(() -> AppVersion.builder().clientType(clientType).clientName(clientType).build());

        if (updateReq.getCurrentVersion() != null) current.setCurrentVersion(updateReq.getCurrentVersion());
        if (updateReq.getMinRequiredVersion() != null) current.setMinRequiredVersion(updateReq.getMinRequiredVersion());
        current.setForceUpdateEnabled(updateReq.isForceUpdateEnabled());
        current.setMaintenanceMode(updateReq.isMaintenanceMode());
        if (updateReq.getPromptTitle() != null) current.setPromptTitle(updateReq.getPromptTitle());
        if (updateReq.getPromptMessage() != null) current.setPromptMessage(updateReq.getPromptMessage());

        AppVersion saved = appVersionRepository.save(current);

        auditLogService.record(
                actor != null ? actor : "ADMIN",
                "ADMIN",
                "VERSION_CONTROL_UPDATED",
                "SYSTEM_VERSION",
                clientType,
                "Client " + clientType + " version updated to " + current.getCurrentVersion() + " (maint=" + current.isMaintenanceMode() + ")",
                "127.0.0.1"
        );

        return saved;
    }
}
