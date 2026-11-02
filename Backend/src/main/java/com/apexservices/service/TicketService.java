package com.apexservices.service;

import com.apexservices.model.SupportTicket;
import com.apexservices.model.TicketMessage;
import com.apexservices.repository.SupportTicketRepository;
import com.apexservices.repository.TicketMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketService {

    private final SupportTicketRepository ticketRepository;
    private final TicketMessageRepository messageRepository;
    private final AuditLogService auditLogService;
    private final SimpMessagingTemplate messagingTemplate;

    public List<SupportTicket> getAllTickets() {
        return ticketRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<SupportTicket> getTicketsForUser(Long userId) {
        return ticketRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Optional<SupportTicket> getTicketById(String id) {
        return ticketRepository.findById(id);
    }

    @Transactional
    public SupportTicket createTicket(
            Long userId,
            String userType,
            String customerName,
            String customerEmail,
            String customerPhone,
            String workRequestId,
            String subject,
            String category,
            String priority,
            String initialMessageContent
    ) {
        String ticketId = "TCK-" + (System.currentTimeMillis() % 1000000);

        SupportTicket ticket = SupportTicket.builder()
                .id(ticketId)
                .userId(userId)
                .userType(userType != null ? userType.toUpperCase() : "CUSTOMER")
                .customerName(customerName != null ? customerName : "Valued User")
                .customerEmail(customerEmail)
                .customerPhone(customerPhone)
                .workRequestId(workRequestId)
                .subject(subject != null ? subject : "Service Inquiry")
                .category(category != null ? category : "GENERAL")
                .priority(priority != null ? priority : "MEDIUM")
                .status("OPEN")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        SupportTicket saved = ticketRepository.save(ticket);

        if (initialMessageContent != null && !initialMessageContent.isBlank()) {
            TicketMessage initialMessage = TicketMessage.builder()
                    .ticket(saved)
                    .senderId(userId)
                    .senderName(customerName != null ? customerName : "User")
                    .isStaff(false)
                    .messageText(initialMessageContent)
                    .createdAt(LocalDateTime.now())
                    .build();
            messageRepository.save(initialMessage);
        }

        auditLogService.record(
                userId != null ? userId.toString() : "CLIENT",
                userType != null ? userType : "CUSTOMER",
                "TICKET_CREATED",
                "SUPPORT_TICKET",
                ticketId,
                "Support ticket created: " + subject,
                "127.0.0.1"
        );

        // Push real-time notification to admin topic
        try {
            messagingTemplate.convertAndSend("/topic/admin-tickets", saved);
        } catch (Exception e) {
            log.debug("WebSocket notify skipped: {}", e.getMessage());
        }

        return saved;
    }

    @Transactional
    public TicketMessage replyTicket(
            String ticketId,
            Long senderId,
            String senderName,
            boolean isStaff,
            String text
    ) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Support ticket not found: " + ticketId));

        TicketMessage msg = TicketMessage.builder()
                .ticket(ticket)
                .senderId(senderId)
                .senderName(senderName != null ? senderName : (isStaff ? "Official Support" : "User"))
                .isStaff(isStaff)
                .messageText(text)
                .createdAt(LocalDateTime.now())
                .build();

        TicketMessage savedMsg = messageRepository.save(msg);

        ticket.setStatus(isStaff ? "IN_PROGRESS" : "OPEN");
        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        auditLogService.record(
                senderId != null ? senderId.toString() : (isStaff ? "ADMIN" : "USER"),
                isStaff ? "STAFF" : "USER",
                "TICKET_REPLIED",
                "SUPPORT_TICKET",
                ticketId,
                (isStaff ? "Staff reply" : "User reply") + ": " + (text.length() > 50 ? text.substring(0, 50) + "..." : text),
                "127.0.0.1"
        );

        // Real-time broadcast to ticket subscribers
        try {
            messagingTemplate.convertAndSend("/topic/tickets/" + ticketId, savedMsg);
        } catch (Exception e) {
            log.debug("WebSocket notify skipped: {}", e.getMessage());
        }

        return savedMsg;
    }

    @Transactional
    public SupportTicket resolveTicket(String ticketId, String resolvedBy) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Support ticket not found: " + ticketId));

        ticket.setStatus("RESOLVED");
        ticket.setAssignedTo(resolvedBy);
        ticket.setUpdatedAt(LocalDateTime.now());
        SupportTicket saved = ticketRepository.save(ticket);

        auditLogService.record(
                resolvedBy != null ? resolvedBy : "ADMIN",
                "ADMIN",
                "TICKET_RESOLVED",
                "SUPPORT_TICKET",
                ticketId,
                "Ticket resolved by " + resolvedBy,
                "127.0.0.1"
        );

        try {
            messagingTemplate.convertAndSend("/topic/tickets/" + ticketId, saved);
        } catch (Exception e) {
            log.debug("WebSocket notify skipped: {}", e.getMessage());
        }

        return saved;
    }
}
