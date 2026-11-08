package com.apexservices.security;

import com.apexservices.dto.request.WorkRequestDto;
import com.apexservices.dto.response.WorkRequestResponseDto;
import com.apexservices.model.*;
import com.apexservices.repository.*;
import com.apexservices.service.TicketService;
import com.apexservices.service.WorkRequestService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.Collections;
import java.util.HashSet;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
@DisplayName("Work Request, Support Ticket, and Staff RBAC Security Integration Suite")
public class WorkRequestAndTicketSecurityIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private WorkRequestService workRequestService;

    @Autowired
    private TicketService ticketService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private User customerA;
    private User customerB;
    private User partnerUser;
    private User adminUser;

    private String customerAJwt;
    private String customerBJwt;
    private String partnerJwt;
    private String adminJwt;

    private Category category;
    private WorkRequestResponseDto requestA;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        Category rawCategory = categoryRepository.findByNameIgnoreCase("Custom Carpentry").orElseGet(() ->
                Category.builder()
                        .name("Custom Carpentry")
                        .slug("custom-carpentry")
                        .description("Carpentry service")
                        .build()
        );
        rawCategory.setActive(true);
        category = categoryRepository.save(rawCategory);

        customerA = userRepository.findByEmail("cust.a@apexservices.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("Customer Alpha")
                        .email("cust.a@apexservices.com")
                        .mobileNumber("+919100000011")
                        .password("$2a$10$eD7q9rQvE7.yPskqK8qE6e2Uj1zZpCskJgUqYf45kR2lBvT5/m8q6")
                        .role(Role.ROLE_CUSTOMER)
                        .provider(AuthProvider.LOCAL)
                        .active(true)
                        .build())
        );

        customerB = userRepository.findByEmail("cust.b@apexservices.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("Customer Beta")
                        .email("cust.b@apexservices.com")
                        .mobileNumber("+919100000012")
                        .password("$2a$10$eD7q9rQvE7.yPskqK8qE6e2Uj1zZpCskJgUqYf45kR2lBvT5/m8q6")
                        .role(Role.ROLE_CUSTOMER)
                        .provider(AuthProvider.LOCAL)
                        .active(true)
                        .build())
        );

        partnerUser = userRepository.findByEmail("tech.partner@apexservices.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("Technician Partner")
                        .email("tech.partner@apexservices.com")
                        .mobileNumber("+919100000013")
                        .password("$2a$10$eD7q9rQvE7.yPskqK8qE6e2Uj1zZpCskJgUqYf45kR2lBvT5/m8q6")
                        .role(Role.ROLE_PARTNER)
                        .provider(AuthProvider.LOCAL)
                        .active(true)
                        .serviceCategories(new HashSet<>(Collections.singletonList(category)))
                        .build())
        );

        adminUser = userRepository.findByEmail("master.admin@apexservices.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName("Master Admin")
                        .email("master.admin@apexservices.com")
                        .mobileNumber("+919100000014")
                        .password("$2a$10$eD7q9rQvE7.yPskqK8qE6e2Uj1zZpCskJgUqYf45kR2lBvT5/m8q6")
                        .role(Role.ROLE_ADMIN)
                        .provider(AuthProvider.LOCAL)
                        .active(true)
                        .build())
        );

        customerAJwt = jwtService.generateToken(
                org.springframework.security.core.userdetails.User.withUsername(customerA.getEmail())
                        .password("password")
                        .authorities(customerA.getRole().name())
                        .build()
        );
        customerBJwt = jwtService.generateToken(
                org.springframework.security.core.userdetails.User.withUsername(customerB.getEmail())
                        .password("password")
                        .authorities(customerB.getRole().name())
                        .build()
        );
        partnerJwt = jwtService.generateToken(
                org.springframework.security.core.userdetails.User.withUsername(partnerUser.getEmail())
                        .password("password")
                        .authorities(partnerUser.getRole().name())
                        .build()
        );
        adminJwt = jwtService.generateToken(
                org.springframework.security.core.userdetails.User.withUsername(adminUser.getEmail())
                        .password("password")
                        .authorities(adminUser.getRole().name())
                        .build()
        );

        WorkRequestDto dto = WorkRequestDto.builder()
                .serviceCategory("Custom Carpentry")
                .serviceCategoryId(category.getId())
                .customerName(customerA.getFullName())
                .customerEmail(customerA.getEmail())
                .contactPhone(customerA.getMobileNumber())
                .serviceAddress("101 Sunset Blvd, Flat A")
                .problemDescription("Hinge broken, need urgent repair")
                .urgency("Standard")
                .build();

        requestA = workRequestService.createWorkRequest(dto, customerA.getEmail());
    }

    // =========================================================================
    // 1. WORK REQUEST AUTHORIZATION TESTS (SEC-01 & SEC-02 & SEC-04)
    // =========================================================================

    @Test
    @DisplayName("SEC-01: Unauthenticated request to /api/work-requests must return 401 Unauthorized")
    void testUnauthenticatedCannotListWorkRequests() throws Exception {
        mockMvc.perform(get("/api/work-requests"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-01: Customer A listing work requests sees ONLY Customer A records")
    void testCustomerOnlySeesOwnWorkRequests() throws Exception {
        // Customer A requests
        mockMvc.perform(get("/api/work-requests")
                        .header("Authorization", "Bearer " + customerAJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].customerEmail").value(customerA.getEmail()))
                .andExpect(jsonPath("$[0].completionOtp").doesNotExist());

        // Customer B requests (none created for B yet, should see empty list)
        mockMvc.perform(get("/api/work-requests")
                        .header("Authorization", "Bearer " + customerBJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("SEC-02: Completion OTP is NEVER exposed in the general work request list")
    void testCompletionOtpNotExposedInList() throws Exception {
        mockMvc.perform(get("/api/work-requests")
                        .header("Authorization", "Bearer " + customerAJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].completionOtp").doesNotExist());
    }

    @Test
    @DisplayName("SEC-02: Customer A can access their own job completion OTP")
    void testCustomerCanRetrieveOwnCompletionOtp() throws Exception {
        mockMvc.perform(get("/api/work-requests/" + requestA.getId() + "/completion-otp")
                        .header("Authorization", "Bearer " + customerAJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completionOtp").isString())
                .andExpect(jsonPath("$.completionOtp").isNotEmpty());
    }

    @Test
    @DisplayName("SEC-02: Partner CANNOT access customer completion OTP directly via endpoint")
    void testPartnerCannotRetrieveCustomerCompletionOtp() throws Exception {
        mockMvc.perform(get("/api/work-requests/" + requestA.getId() + "/completion-otp")
                        .header("Authorization", "Bearer " + partnerJwt))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SEC-04: Customer B CANNOT cancel Customer A's work request (returns 403)")
    void testCustomerCannotCancelOtherCustomerRequest() throws Exception {
        mockMvc.perform(post("/api/work-requests/" + requestA.getId() + "/cancel")
                        .header("Authorization", "Bearer " + customerBJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Malicious cancellation attempt\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SEC-04: Customer A CAN cancel their own OPEN work request")
    void testCustomerCanCancelOwnRequest() throws Exception {
        mockMvc.perform(post("/api/work-requests/" + requestA.getId() + "/cancel")
                        .header("Authorization", "Bearer " + customerAJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"No longer needed\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    // =========================================================================
    // 2. SUPPORT TICKET AUTHORIZATION & IDOR DEFENSE (SEC-03)
    // =========================================================================

    @Test
    @DisplayName("SEC-03: Unauthenticated ticket details access returns 401 Unauthorized")
    void testUnauthenticatedCannotAccessTicketDetails() throws Exception {
        SupportTicket ticket = ticketService.createTicket(
                customerA.getId(),
                "CUSTOMER",
                customerA.getFullName(),
                customerA.getEmail(),
                customerA.getMobileNumber(),
                requestA.getId(),
                "Dispute on pricing",
                "BILLING",
                "HIGH",
                "Initial dispute message"
        );

        mockMvc.perform(get("/api/tickets/" + ticket.getId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-03: Customer B CANNOT view Customer A's support ticket (returns 403 IDOR blocked)")
    void testCustomerCannotAccessOtherCustomerTicket() throws Exception {
        SupportTicket ticket = ticketService.createTicket(
                customerA.getId(),
                "CUSTOMER",
                customerA.getFullName(),
                customerA.getEmail(),
                customerA.getMobileNumber(),
                requestA.getId(),
                "Private customer ticket",
                "GENERAL",
                "MEDIUM",
                "Confidential text"
        );

        mockMvc.perform(get("/api/tickets/" + ticket.getId())
                        .header("Authorization", "Bearer " + customerBJwt))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SEC-03: Customer B CANNOT reply to Customer A's support ticket (returns 403)")
    void testCustomerCannotReplyToOtherCustomerTicket() throws Exception {
        SupportTicket ticket = ticketService.createTicket(
                customerA.getId(),
                "CUSTOMER",
                customerA.getFullName(),
                customerA.getEmail(),
                customerA.getMobileNumber(),
                requestA.getId(),
                "Dispute inquiry",
                "GENERAL",
                "LOW",
                "Customer message"
        );

        mockMvc.perform(post("/api/tickets/" + ticket.getId() + "/reply")
                        .header("Authorization", "Bearer " + customerBJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"Unauthorized reply attempt\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SEC-03: Customer A CAN view and reply to their own support ticket")
    void testCustomerCanViewAndReplyToOwnTicket() throws Exception {
        SupportTicket ticket = ticketService.createTicket(
                customerA.getId(),
                "CUSTOMER",
                customerA.getFullName(),
                customerA.getEmail(),
                customerA.getMobileNumber(),
                requestA.getId(),
                "Homeowner ticket",
                "GENERAL",
                "MEDIUM",
                "Owner inquiry"
        );

        // View ticket
        mockMvc.perform(get("/api/tickets/" + ticket.getId())
                        .header("Authorization", "Bearer " + customerAJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(ticket.getId()))
                .andExpect(jsonPath("$.subject").value("Homeowner ticket"));

        // Reply to ticket
        mockMvc.perform(post("/api/tickets/" + ticket.getId() + "/reply")
                        .header("Authorization", "Bearer " + customerAJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"Adding more context to my issue\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // =========================================================================
    // 3. STAFF & RBAC MANAGEMENT ENDPOINTS (FLOW-03)
    // =========================================================================

    @Test
    @DisplayName("FLOW-03: Admin can query roles matrix and team members")
    void testAdminCanQueryRoles() throws Exception {
        mockMvc.perform(get("/api/admin/roles")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.team").isArray());
    }

    @Test
    @DisplayName("FLOW-03: Admin can invite new staff member and delete member safely")
    void testAdminCanInviteAndRemoveStaffMember() throws Exception {
        // Invite new staff member
        String invitePayload = objectMapper.writeValueAsString(Map.of(
                "name", "Operations Coordinator",
                "email", "ops.lead@apexservices.com",
                "roleId", "OPERATIONS_MANAGER"
        ));

        String responseStr = mockMvc.perform(post("/api/admin/roles/team")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invitePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("ops.lead@apexservices.com"))
                .andExpect(jsonPath("$.roleId").value("OPERATIONS_MANAGER"))
                .andReturn().getResponse().getContentAsString();

        Map<String, Object> respMap = objectMapper.readValue(responseStr, Map.class);
        String staffId = (String) respMap.get("id");
        assertNotNull(staffId);

        // Remove staff member
        mockMvc.perform(delete("/api/admin/roles/team/" + staffId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
