package com.apexservices.security;

import com.apexservices.exception.RateLimitExceededException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory sliding-window rate limiter for authentication endpoints.
 * Defends against brute-force password guessing and credential-stuffing attacks.
 */
@Service
@Slf4j
public class LoginRateLimiterService {

    private static final int MAX_FAILED_ATTEMPTS_PER_IDENTIFIER = 5;
    private static final int MAX_FAILED_ATTEMPTS_PER_IP = 15;
    private static final long LOCKOUT_DURATION_MS = 60000L; // 60 seconds

    private static class AttemptRecord {
        int count;
        long firstAttemptTime;
        long blockedUntil;

        AttemptRecord(long now) {
            this.count = 1;
            this.firstAttemptTime = now;
            this.blockedUntil = 0;
        }
    }

    private final Map<String, AttemptRecord> identifierAttempts = new ConcurrentHashMap<>();
    private final Map<String, AttemptRecord> ipAttempts = new ConcurrentHashMap<>();

    /**
     * Checks if the request is rate-limited before attempting authentication.
     */
    public void checkRateLimit(String clientIp, String identifier) {
        long now = System.currentTimeMillis();

        if (clientIp != null) {
            AttemptRecord ipRec = ipAttempts.get(clientIp);
            if (ipRec != null && ipRec.blockedUntil > now) {
                long waitSec = (ipRec.blockedUntil - now) / 1000 + 1;
                log.warn("[SECURITY AUDIT] Rate limit triggered for IP [{}] - blocked for {}s", clientIp, waitSec);
                throw new RateLimitExceededException(
                    "Too many failed login requests from your network. Please try again in " + waitSec + " seconds.",
                    waitSec
                );
            }
        }

        if (identifier != null && !identifier.isBlank()) {
            String norm = identifier.trim().toLowerCase();
            AttemptRecord idRec = identifierAttempts.get(norm);
            if (idRec != null && idRec.blockedUntil > now) {
                long waitSec = (idRec.blockedUntil - now) / 1000 + 1;
                log.warn("[SECURITY AUDIT] Rate limit triggered for identifier [{}...] - blocked for {}s",
                        norm.substring(0, Math.min(norm.length(), 4)), waitSec);
                throw new RateLimitExceededException(
                    "Too many failed login attempts for this account. Please wait " + waitSec + " seconds before trying again.",
                    waitSec
                );
            }
        }
    }

    /**
     * Records a failed authentication attempt.
     */
    public void recordFailedAttempt(String clientIp, String identifier) {
        long now = System.currentTimeMillis();

        if (clientIp != null) {
            ipAttempts.compute(clientIp, (key, rec) -> {
                if (rec == null || now - rec.firstAttemptTime > LOCKOUT_DURATION_MS) {
                    return new AttemptRecord(now);
                }
                rec.count++;
                if (rec.count >= MAX_FAILED_ATTEMPTS_PER_IP) {
                    rec.blockedUntil = now + LOCKOUT_DURATION_MS;
                }
                return rec;
            });
        }

        if (identifier != null && !identifier.isBlank()) {
            String norm = identifier.trim().toLowerCase();
            identifierAttempts.compute(norm, (key, rec) -> {
                if (rec == null || now - rec.firstAttemptTime > LOCKOUT_DURATION_MS) {
                    return new AttemptRecord(now);
                }
                rec.count++;
                if (rec.count >= MAX_FAILED_ATTEMPTS_PER_IDENTIFIER) {
                    rec.blockedUntil = now + LOCKOUT_DURATION_MS;
                }
                return rec;
            });
        }
    }

    /**
     * Resets failed attempt counter on successful login.
     */
    public void resetOnSuccess(String clientIp, String identifier) {
        if (clientIp != null) ipAttempts.remove(clientIp);
        if (identifier != null && !identifier.isBlank()) identifierAttempts.remove(identifier.trim().toLowerCase());
    }

    public void clearAll() {
        identifierAttempts.clear();
        ipAttempts.clear();
    }

    @Scheduled(fixedRate = 300000) // Cleanup every 5 minutes
    public void evictStaleRecords() {
        long now = System.currentTimeMillis();
        identifierAttempts.entrySet().removeIf(e -> e.getValue().blockedUntil < now && now - e.getValue().firstAttemptTime > LOCKOUT_DURATION_MS);
        ipAttempts.entrySet().removeIf(e -> e.getValue().blockedUntil < now && now - e.getValue().firstAttemptTime > LOCKOUT_DURATION_MS);
    }
}
