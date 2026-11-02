package com.apexservices.controller;

import com.apexservices.model.AppVersion;
import com.apexservices.service.PlatformConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://apexservices-admin-portal.netlify.app", "https://apexservicesondemand.netlify.app", "https://apexservices-partner-portal.netlify.app"})
public class PublicConfigController {

    private final PlatformConfigService platformConfigService;

    @GetMapping("/public-flags")
    public ResponseEntity<Map<String, Boolean>> getPublicFlags() {
        return ResponseEntity.ok(platformConfigService.getPublicFlagsMap());
    }

    @GetMapping("/version-check")
    public ResponseEntity<?> checkVersion(
            @RequestParam(defaultValue = "customer_web") String client,
            @RequestParam(required = false) String currentVersion
    ) {
        return platformConfigService.getVersionByClient(client)
                .map(v -> {
                    boolean requiresUpdate = false;
                    if (currentVersion != null && !currentVersion.isBlank()) {
                        requiresUpdate = isVersionLower(currentVersion, v.getMinRequiredVersion());
                    }
                    return ResponseEntity.ok(Map.of(
                            "client", v.getClientType(),
                            "latestVersion", v.getCurrentVersion(),
                            "minRequiredVersion", v.getMinRequiredVersion(),
                            "forceUpdateEnabled", v.isForceUpdateEnabled() && requiresUpdate,
                            "maintenanceMode", v.isMaintenanceMode(),
                            "promptTitle", v.getPromptTitle() != null ? v.getPromptTitle() : "Update Available",
                            "promptMessage", v.getPromptMessage() != null ? v.getPromptMessage() : "Please update to latest version."
                    ));
                })
                .orElse(ResponseEntity.ok(Map.of(
                        "maintenanceMode", false,
                        "forceUpdateEnabled", false
                )));
    }

    private boolean isVersionLower(String current, String min) {
        try {
            String[] currParts = current.replaceAll("[^0-9.]", "").split("\\.");
            String[] minParts = min.replaceAll("[^0-9.]", "").split("\\.");
            int length = Math.max(currParts.length, minParts.length);
            for (int i = 0; i < length; i++) {
                int c = i < currParts.length ? Integer.parseInt(currParts[i]) : 0;
                int m = i < minParts.length ? Integer.parseInt(minParts[i]) : 0;
                if (c < m) return true;
                if (c > m) return false;
            }
        } catch (Exception ignored) {}
        return false;
    }
}
