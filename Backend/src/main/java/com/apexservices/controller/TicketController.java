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
        String category = (String) req.getOrDefault("category", "DISPUTE");
        String priority = (String) req.getOrDefault("priority", "HIGH");
        String initialMessage = (String) req.getOrDefault("message", (String) req.get("details"));
        String workRequestId = (String) req.get("workRequestId");
        String customerName = (String) req.getOrDefault("name", "Customer");
        String customerEmail = (String) req.get("email");
        String customerPhone = (String) req.get("phone");

        Long userId = null;
        String userType = "CUSTOMER";

        if (principal != null) {
            Optional<User> uOpt = userRepository.findByIdentifier(principal.getName());
            if (uOpt.isPresent()) {
                User u = uOpt.get();
                userId = u.getId();
                userType = u.getRole() != null ? u.getRole().name().replace("ROLE_", "") : "CUSTOMER";
                if (customerName == null || customerName.equals("Customer")) customerName = u.getFullName();
                if (customerEmail == null) customerEmail = u.getEmail();
                if (customerPhone == null) customerPhone = u.getMobileNumber();
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
        return ResponseEntity.ok(msg);
    }
}
