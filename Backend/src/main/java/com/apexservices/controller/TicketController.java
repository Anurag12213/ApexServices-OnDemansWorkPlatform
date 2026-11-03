package com.apexservices.controller;

import com.apexservices.model.SupportTicket;
import com.apexservices.model.TicketMessage;
import com.apexservices.model.User;
import com.apexservices.repository.UserRepository;
import com.apexservices.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://apexservices-admin-portal.netlify.app", "https://apexservicesondemand.netlify.app", "https://apexservices-partner-portal.netlify.app"})
public class TicketController {

    private final TicketService ticketService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> submitTicket(@RequestBody Map<String, Object> req, Principal principal) {
        String subject = (String) req.getOrDefault("subject", "Service Dispute / Inquiry");
        String category = (String) req.getOrDefault("category", "GENERAL");
        String priority = (String) req.getOrDefault("priority", "MEDIUM");
        
        String initialMessage = (String) req.get("message");
        if (initialMessage == null || initialMessage.isBlank()) {
            initialMessage = (String) req.get("details");
        }
        if (initialMessage == null || initialMessage.isBlank()) {
            initialMessage = (String) req.get("description");
        }
        if (initialMessage == null || initialMessage.isBlank()) {
            initialMessage = (String) req.get("text");
        }
        if (initialMessage == null) initialMessage = "";

        String workRequestId = (String) req.getOrDefault("workRequestId", (String) req.get("relatedOrder"));
        String customerName = (String) req.getOrDefault("customerName", (String) req.getOrDefault("name", "User"));
        String customerEmail = (String) req.getOrDefault("customerEmail", (String) req.get("email"));
        String customerPhone = (String) req.getOrDefault("customerPhone", (String) req.getOrDefault("phone", (String) req.get("mobileNumber")));

        Long userId = null;
        String userType = (String) req.getOrDefault("userType", "CUSTOMER");

        if (principal != null) {
            Optional<User> uOpt = userRepository.findByIdentifier(principal.getName());
            if (uOpt.isPresent()) {
                User u = uOpt.get();
                userId = u.getId();
                userType = u.getRole() != null ? u.getRole().name().replace("ROLE_", "") : "CUSTOMER";
                if (customerName == null || customerName.equals("User") || customerName.equals("Customer") || customerName.isBlank()) {
                    customerName = u.getFullName();
                }
                if (customerEmail == null || customerEmail.isBlank()) customerEmail = u.getEmail();
                if (customerPhone == null || customerPhone.isBlank()) customerPhone = u.getMobileNumber();
            }
        }

        SupportTicket ticket = ticketService.createTicket(
                userId,
                userType,
                customerName,
                customerEmail,
                customerPhone,
                workRequestId,
                subject,
                category,
                priority,
                initialMessage
        );

        return ResponseEntity.ok(ticket);
    }

    @GetMapping("/my-tickets")
    public ResponseEntity<List<SupportTicket>> getMyTickets(Principal principal) {
        if (principal == null) return ResponseEntity.ok(List.of());
        return userRepository.findByIdentifier(principal.getName())
                .map(u -> ResponseEntity.ok(ticketService.getTicketsForUser(u.getId())))
                .orElse(ResponseEntity.ok(List.of()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTicketDetails(@PathVariable String id) {
        return ticketService.getTicketById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<?> replyTicket(@PathVariable String id, @RequestBody Map<String, String> req, Principal principal) {
        String text = req.get("text");
        if (text == null || text.isBlank()) {
            text = req.get("message");
        }
        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Reply message text is required"));
        }

        Long senderId = null;
        String senderName = "User";
        boolean isStaff = false;

        if (principal != null) {
            Optional<User> uOpt = userRepository.findByIdentifier(principal.getName());
            if (uOpt.isPresent()) {
                User u = uOpt.get();
                senderId = u.getId();
                senderName = u.getFullName();
                isStaff = u.getRole() == com.apexservices.model.Role.ROLE_ADMIN;
            }
        }

        TicketMessage msg = ticketService.replyTicket(id, senderId, senderName, isStaff, text);
        SupportTicket updatedTicket = ticketService.getTicketById(id).orElse(null);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", msg,
                "ticket", updatedTicket != null ? updatedTicket : Map.of()
        ));
    }
}
