package com.apexservices.service;

import com.apexservices.dto.WorkRequestResponseDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class DispatchNotificationService {

    private static final Logger log = LoggerFactory.getLogger(DispatchNotificationService.class);
    private final SimpMessagingTemplate messagingTemplate;

    public DispatchNotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Broadcasts a new work request offer to all eligible partners.
     */
    public void broadcastNewRequest(WorkRequestResponseDto requestDto) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "NEW_WORK_REQUEST");
        payload.put("data", requestDto);

        log.info("Broadcasting new work request: {} to /topic/broadcasts", requestDto.getId());
        try {
            messagingTemplate.convertAndSend("/topic/broadcasts", (Object) payload);
            
            if (requestDto.getServiceCategory() != null) {
                String catSlug = requestDto.getServiceCategory().trim().toLowerCase().replaceAll("[^a-z0-9]", "-");
                messagingTemplate.convertAndSend("/topic/category." + catSlug, (Object) payload);
            }
        } catch (Exception ex) {
            log.warn("Failed to send WebSocket broadcast for request {}: {}", requestDto.getId(), ex.getMessage());
        }
    }

    /**
     * Notifies that a request was successfully claimed by a partner.
     * All other listening partners will dismiss the incoming request card.
     */
    public void notifyRequestClaimed(String requestId, Long winnerPartnerId, String winnerPartnerName, WorkRequestResponseDto requestDto) {
        Map<String, Object> partnerCancelPayload = new LinkedHashMap<>();
        partnerCancelPayload.put("type", "REQUEST_CLAIMED");
        partnerCancelPayload.put("requestId", requestId);
        partnerCancelPayload.put("winnerPartnerId", winnerPartnerId);
        partnerCancelPayload.put("winnerPartnerName", winnerPartnerName);
        partnerCancelPayload.put("message", "This work request has been claimed by another partner.");

        log.info("Broadcasting request claimed event for request {}", requestId);
        try {
            // Dismissal notice for all other partners
            messagingTemplate.convertAndSend("/topic/broadcasts", (Object) partnerCancelPayload);
            
            // Channel for the customer and winning partner watching this specific request
            Map<String, Object> updatePayload = new LinkedHashMap<>();
            updatePayload.put("type", "REQUEST_ASSIGNED");
            updatePayload.put("requestId", requestId);
            updatePayload.put("data", requestDto);
            messagingTemplate.convertAndSend("/topic/requests." + requestId, (Object) updatePayload);
        } catch (Exception ex) {
            log.warn("Failed to send WebSocket claim notification for request {}: {}", requestId, ex.getMessage());
        }
    }

    /**
     * Notifies customer and partner of stage progression.
     */
    public void notifyStageUpdated(String requestId, WorkRequestResponseDto requestDto) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "STAGE_UPDATED");
        payload.put("requestId", requestId);
        payload.put("stage", requestDto.getStage());
        payload.put("status", requestDto.getStatus());
        payload.put("data", requestDto);

        try {
            messagingTemplate.convertAndSend("/topic/requests." + requestId, (Object) payload);
        } catch (Exception ex) {
            log.warn("Failed to send stage update notification for request {}: {}", requestId, ex.getMessage());
        }
    }

    /**
     * Notifies that a request timed out and expired without being claimed.
     */
    public void notifyRequestExpired(String requestId) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "REQUEST_EXPIRED");
        payload.put("requestId", requestId);
        payload.put("message", "Work request has expired with no claiming partner.");

        try {
            messagingTemplate.convertAndSend("/topic/broadcasts", (Object) payload);
            messagingTemplate.convertAndSend("/topic/requests." + requestId, (Object) payload);
        } catch (Exception ex) {
            log.warn("Failed to send expiration notification for request {}: {}", requestId, ex.getMessage());
        }
    }
}
