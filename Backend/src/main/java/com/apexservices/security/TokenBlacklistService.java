package com.apexservices.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory thread-safe token revocation service.
 * Stores cryptographically hashed tokens (SHA-256) with expiration timestamps
 * to immediately invalidate tokens upon user logout.
 */
@Service
@Slf4j
public class TokenBlacklistService {

    private final Map<String, Long> blacklistedTokenHashes = new ConcurrentHashMap<>();

    /**
     * Revoke a token until its natural expiration timestamp.
     */
    public void revokeToken(String token, Date expirationDate) {
        if (token == null || token.isBlank()) return;
        String hash = hashToken(token);
        long expiryEpochMs = expirationDate != null ? expirationDate.getTime() : System.currentTimeMillis() + 86400000L;
        blacklistedTokenHashes.put(hash, expiryEpochMs);
        log.info("[SECURITY AUDIT] Token revoked successfully (hash: {}...)", hash.substring(0, Math.min(hash.length(), 12)));
    }

    /**
     * Check whether a token has been explicitly revoked via logout.
     */
    public boolean isRevoked(String token) {
        if (token == null || token.isBlank()) return false;
        String hash = hashToken(token);
        Long expiry = blacklistedTokenHashes.get(hash);
        if (expiry == null) {
            return false;
        }
        if (System.currentTimeMillis() > expiry) {
            blacklistedTokenHashes.remove(hash);
            return false;
        }
        return true;
    }

    /**
     * Cleanup expired entries every 15 minutes to prevent memory leak.
     */
    @Scheduled(fixedRate = 900000)
    public void evictExpiredTokens() {
        long now = System.currentTimeMillis();
        int initialSize = blacklistedTokenHashes.size();
        blacklistedTokenHashes.entrySet().removeIf(entry -> entry.getValue() < now);
        int purged = initialSize - blacklistedTokenHashes.size();
        if (purged > 0) {
            log.info("[SECURITY AUDIT] Purged {} expired tokens from revocation blacklist", purged);
        }
    }

    public void clearAll() {
        blacklistedTokenHashes.clear();
    }

    private String hashToken(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
