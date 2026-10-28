package com.apexservices;

import com.apexservices.exception.ConflictException;
import com.apexservices.model.*;
import com.apexservices.repository.*;
import com.apexservices.service.OtpSecurityService;
import com.apexservices.service.PaymentAndLedgerService;
import com.apexservices.service.ReviewService;
import com.apexservices.service.WorkRequestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class OtpAndWorkflowHardeningIntegrationTest {

    @Autowired
    private WorkRequestRepository workRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpSecurityService otpSecurityService;

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private PaymentAndLedgerService paymentAndLedgerService;

    @Autowired
    private WorkRequestService workRequestService;

    @Autowired
    private CompletionVerificationRepository verificationRepository;

    @Autowired
    private FinancialLedgerEntryRepository ledgerRepository;

    private User testCustomer;
    private User testPartner;
    private WorkRequest testRequest;

    @BeforeEach
    void setUp() {
        testCustomer = userRepository.findByEmail("customer@apexservices.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .fullName("Test Customer")
                        .email("customer@apexservices.com")
                        .provider(AuthProvider.LOCAL)
                        .role(Role.ROLE_CUSTOMER)
                        .active(true)
                        .build()));

        testPartner = userRepository.findByEmail("partner@apexservices.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .fullName("Test Partner")
                        .email("partner@apexservices.com")
                        .provider(AuthProvider.LOCAL)
                        .role(Role.ROLE_PARTNER)
                        .active(true)
                        .build()));

        testRequest = workRequestRepository.save(WorkRequest.builder()
                .id("REQ-TEST-" + System.currentTimeMillis())
                .customer(testCustomer)
                .customerName(testCustomer.getFullName())
                .customerEmail(testCustomer.getEmail())
                .serviceCategory("Custom Carpentry")
                .serviceAddress("101 Greenfield Ave")
                .problemDescription("Door hinge repair")
                .estimatedCost(new BigDecimal("499.00"))
                .status(WorkRequestStatus.IN_PROGRESS)
                .stage(4)
                .assignedPartner(testPartner)
                .assignedPartnerName(testPartner.getFullName())
                .assignedPartnerPhone("9876543210")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
    }

    @Test
    @DisplayName("OTP Generation and Single-Use Consumption")
    void testOtpGenerationAndVerification() {
        String otp = otpSecurityService.generateAndStoreOtp(testRequest);
        assertNotNull(otp);
        assertEquals(4, otp.length());

        // Incorrect OTP should fail
        assertThrows(IllegalArgumentException.class, () -> {
            otpSecurityService.verifyAndConsumeOtp(testRequest.getId(), "0000".equals(otp) ? "1111" : "0000");
        });

        // Correct OTP should succeed
        boolean success = otpSecurityService.verifyAndConsumeOtp(testRequest.getId(), otp);
        assertTrue(success);

        // Replay/Reuse of consumed OTP must fail
        assertThrows(ConflictException.class, () -> {
            otpSecurityService.verifyAndConsumeOtp(testRequest.getId(), otp);
        });
    }

    @Test
    @DisplayName("End-to-End Work Completion via Customer OTP")
    void testWorkCompletionWithOtp() {
        String otp = otpSecurityService.generateAndStoreOtp(testRequest);

        var response = workRequestService.verifyCompletion(testRequest.getId(), testPartner.getEmail(), otp);
        assertNotNull(response);
        assertEquals("COMPLETED", response.getStatus());
        assertEquals("PAYMENT_PENDING", response.getPaymentStatus());
        assertEquals(5, response.getStage());
    }

    @Test
    @DisplayName("Payment Settlement and Immutable Ledger Accounting (80/20 Split)")
    void testPaymentSettlementAndLedger() {
        Payment payment = paymentAndLedgerService.settleWorkRequestPayment(
                testRequest.getId(),
                "UPI",
                new BigDecimal("499.00"),
                testCustomer.getEmail()
        );

        assertNotNull(payment);
        assertEquals(PaymentStatus.PAID, payment.getStatus());

        var ledgerEntries = ledgerRepository.findByWorkRequestIdOrderByCreatedAtDesc(testRequest.getId());
        assertEquals(2, ledgerEntries.size());

        var feeEntry = ledgerEntries.stream().filter(e -> "PLATFORM_FEE".equals(e.getEntryType())).findFirst().orElse(null);
        var earnEntry = ledgerEntries.stream().filter(e -> "PARTNER_EARNING".equals(e.getEntryType())).findFirst().orElse(null);

        assertNotNull(feeEntry);
        assertNotNull(earnEntry);

        // 20% of 499 = 99.80, 80% of 499 = 399.20
        assertEquals(new BigDecimal("99.80"), feeEntry.getAmount());
        assertEquals(new BigDecimal("399.20"), earnEntry.getAmount());

        // Idempotency: Second settlement attempt must not duplicate ledger entries
        paymentAndLedgerService.settleWorkRequestPayment(
                testRequest.getId(),
                "UPI",
                new BigDecimal("499.00"),
                testCustomer.getEmail()
        );

        var ledgerAfterReplay = ledgerRepository.findByWorkRequestIdOrderByCreatedAtDesc(testRequest.getId());
        assertEquals(2, ledgerAfterReplay.size());
    }

    @Test
    @DisplayName("Review Submission and Dynamic Rating Calculation")
    void testReviewSubmissionAndRatingCalculation() {
        testRequest.setStatus(WorkRequestStatus.COMPLETED);
        workRequestRepository.save(testRequest);

        var review = reviewService.submitReview(testRequest.getId(), 5, "Outstanding service!", testCustomer.getEmail());
        assertNotNull(review);
        assertEquals(5, review.getRating());

        // Duplicate review must be rejected
        assertThrows(ConflictException.class, () -> {
            reviewService.submitReview(testRequest.getId(), 4, "Second review", testCustomer.getEmail());
        });

        String formattedRating = reviewService.formatPartnerRating(testPartner.getId());
        assertTrue(formattedRating.contains("5.0"));
        assertTrue(formattedRating.contains("reviews") || formattedRating.contains("review"));
    }
}
