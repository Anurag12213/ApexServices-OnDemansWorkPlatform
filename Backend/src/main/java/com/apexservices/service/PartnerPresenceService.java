package com.apexservices.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PartnerPresenceService {

    private static final Logger log = LoggerFactory.getLogger(PartnerPresenceService.class);

    public static class PartnerPresenceState {
        private final Long partnerId;
        private final String partnerEmail;
        private boolean online;
        private boolean available;
        private String serviceCategory;
        private Instant lastHeartbeat;

        public PartnerPresenceState(Long partnerId, String partnerEmail, boolean online, boolean available, String serviceCategory) {
            this.partnerId = partnerId;
            this.partnerEmail = partnerEmail;
            this.online = online;
            this.available = available;
            this.serviceCategory = serviceCategory;
            this.lastHeartbeat = Instant.now();
        }

        public Long getPartnerId() { return partnerId; }
        public String getPartnerEmail() { return partnerEmail; }
        public boolean isOnline() { return online; }
        public void setOnline(boolean online) { this.online = online; }
        public boolean isAvailable() { return available; }
        public void setAvailable(boolean available) { this.available = available; }
        public String getServiceCategory() { return serviceCategory; }
        public void setServiceCategory(String serviceCategory) { this.serviceCategory = serviceCategory; }
        public Instant getLastHeartbeat() { return lastHeartbeat; }
        public void updateHeartbeat() { this.lastHeartbeat = Instant.now(); }
    }

    private final Map<Long, PartnerPresenceState> presenceMap = new ConcurrentHashMap<>();
    private final Map<String, Long> sessionToPartnerMap = new ConcurrentHashMap<>();

    public void updatePresence(Long partnerId, String email, boolean online, boolean available, String category) {
        presenceMap.compute(partnerId, (id, existing) -> {
            if (existing == null) {
                return new PartnerPresenceState(partnerId, email, online, available, category);
            }
            existing.setOnline(online);
            existing.setAvailable(available);
            if (category != null && !category.isBlank()) {
                existing.setServiceCategory(category);
            }
            existing.updateHeartbeat();
            return existing;
        });
        log.info("Partner {} presence updated: online={}, available={}, category={}", email, online, available, category);
    }

    public void registerSession(String sessionId, Long partnerId) {
        sessionToPartnerMap.put(sessionId, partnerId);
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        Long partnerId = sessionToPartnerMap.remove(sessionId);
        if (partnerId != null) {
            PartnerPresenceState state = presenceMap.get(partnerId);
            if (state != null) {
                state.setOnline(false);
                log.info("Partner {} disconnected from WebSocket session {}", partnerId, sessionId);
            }
        }
    }

    public boolean isPartnerEligible(Long partnerId, String requestCategory) {
        PartnerPresenceState state = presenceMap.get(partnerId);
        if (state == null) {
            return true; // Default eligible if not yet tracked in session cache
        }
        if (!state.isAvailable()) {
            return false;
        }
        if (requestCategory == null || state.getServiceCategory() == null) {
            return true;
        }
        return state.getServiceCategory().equalsIgnoreCase(requestCategory)
                || state.getServiceCategory().equalsIgnoreCase("All")
                || "General".equalsIgnoreCase(state.getServiceCategory());
    }

    public Map<Long, PartnerPresenceState> getAllPresence() {
        return presenceMap;
    }
}
