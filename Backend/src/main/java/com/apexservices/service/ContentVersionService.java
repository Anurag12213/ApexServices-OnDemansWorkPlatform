package com.apexservices.service;

import org.springframework.stereotype.Service;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Authoritative Content Version & ETag Invalidation Service.
 * Centralizes cache versioning across the entire application so that any administrative
 * mutation (categories, pricing, branding, feature flags, coupons) immediately and
 * deterministically invalidates cached frontend responses across all client portals.
 */
@Service
public class ContentVersionService {

    private final AtomicLong contentVersion = new AtomicLong(System.currentTimeMillis());

    public long getVersion() {
        return contentVersion.get();
    }

    public long bumpVersion() {
        return contentVersion.updateAndGet(curr -> Math.max(System.currentTimeMillis(), curr + 1));
    }

    public String getDataEtag() {
        return "\"v" + contentVersion.get() + "\"";
    }

    public String getConfigEtag() {
        return "\"cfg_" + contentVersion.get() + "\"";
    }

    public String getCategoryEtag() {
        return "\"cat_" + contentVersion.get() + "\"";
    }

    /**
     * Determines whether the client-provided If-None-Match header matches the authoritative ETag.
     * Supports both strong ETags ("v12345") and weak ETags (W/"v12345").
     */
    public boolean matches(String ifNoneMatch, String currentEtag) {
        if (ifNoneMatch == null || ifNoneMatch.isBlank() || currentEtag == null) {
            return false;
        }
        String cleanClient = ifNoneMatch.trim();
        String cleanCurrent = currentEtag.trim();
        
        if ("*".equals(cleanClient)) return true;
        if (cleanClient.equals(cleanCurrent)) return true;
        if (cleanClient.equals("W/" + cleanCurrent)) return true;
        if (cleanClient.replace("W/", "").equals(cleanCurrent.replace("W/", ""))) return true;
        
        // Handle comma-separated multiple etags
        if (cleanClient.contains(",")) {
            String[] tokens = cleanClient.split(",");
            for (String token : tokens) {
                String t = token.trim();
                if (t.equals(cleanCurrent) || t.equals("W/" + cleanCurrent) || t.replace("W/", "").equals(cleanCurrent.replace("W/", ""))) {
                    return true;
                }
            }
        }
        return false;
    }
}
