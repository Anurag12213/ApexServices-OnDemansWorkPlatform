package com.apexservices.controller;

import com.apexservices.model.SupportTicket;
import com.apexservices.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://apexservices-admin-portal.netlify.app", "https://apexservicesondemand.netlify.app", "https://apexservices-partner-portal.netlify.app"})
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    public ResponseEntity<?> submitTicket(@RequestBody Map<String, Object> req, Principal principal) {
        SupportTicket ticket = ticketService.submitTicket(principal, req);
        return ResponseEntity.ok(ticket);
    }

    @GetMapping("/my-tickets")
    public ResponseEntity<List<SupportTicket>> getMyTickets(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Long userId,
            Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(ticketService.getMyTicketsForPrincipal(principal, email, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTicketDetails(@PathVariable String id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(ticketService.getTicketDetailsForPrincipal(id, principal));
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<?> replyTicket(@PathVariable String id, @RequestBody Map<String, String> req, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(ticketService.replyTicketForPrincipal(id, req, principal));
    }
}
