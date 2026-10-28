package com.apexservices.service;

import com.apexservices.exception.ConflictException;
import com.apexservices.model.*;
import com.apexservices.repository.FinancialLedgerEntryRepository;
import com.apexservices.repository.PaymentRepository;
import com.apexservices.repository.WorkRequestEventRepository;
import com.apexservices.repository.WorkRequestRepository;
import com.apexservices.security.InputSanitizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentAndLedgerService {

    private static final Logger log = LoggerFactory.getLogger(PaymentAndLedgerService.class);

    private final PaymentRepository paymentRepository;
    private final FinancialLedgerEntryRepository ledgerRepository;
    private final WorkRequestRepository workRequestRepository;
    private final WorkRequestEventRepository eventRepository;

    public PaymentAndLedgerService(
            PaymentRepository paymentRepository,
            FinancialLedgerEntryRepository ledgerRepository,
            WorkRequestRepository workRequestRepository,
            WorkRequestEventRepository eventRepository) {
        this.paymentRepository = paymentRepository;
        this.ledgerRepository = ledgerRepository;
        this.workRequestRepository = workRequestRepository;
        this.eventRepository = eventRepository;
    }

    /**
     * Atomically settles customer payment and writes immutable ledger entries.
     * Enforces exactly-once accounting using idempotency keys.
     */
    @Transactional
    public Payment settleWorkRequestPayment(
            String workRequestId,
            String paymentMethod,
            BigDecimal grossAmount,
            String customerEmail) {

        WorkRequest wr = workRequestRepository.findById(workRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found: " + workRequestId));

        if (wr.getAssignedPartner() == null) {
            throw new ConflictException("Cannot settle payment for unassigned work request", "NO_PARTNER_ASSIGNED");
        }

        BigDecimal amount = grossAmount != null && grossAmount.compareTo(BigDecimal.ZERO) > 0
                ? grossAmount
                : (wr.getEstimatedCost() != null ? wr.getEstimatedCost() : new BigDecimal("499.00"));

        String safeMethod = paymentMethod != null && !paymentMethod.isBlank()
                ? InputSanitizer.sanitize(paymentMethod.trim())
                : "UPI";

        String idempotencyKey = "PAY-" + workRequestId + "-" + amount.toPlainString();

        // 1. Idempotency Check: If already processed with this key, return existing payment
        Payment payment = paymentRepository.findByIdempotencyKey(idempotencyKey)
                .orElseGet(() -> Payment.builder()
                        .workRequest(wr)
                        .amount(amount)
                        .currency("INR")
                        .paymentMethod(safeMethod)
                        .status(PaymentStatus.PAID)
                        .idempotencyKey(idempotencyKey)
                        .providerReference("APX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                        .paidAt(LocalDateTime.now())
                        .build()
                );

        if (payment.getId() == null) {
            payment = paymentRepository.save(payment);
        } else if (payment.getStatus() != PaymentStatus.PAID) {
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaidAt(LocalDateTime.now());
            payment = paymentRepository.save(payment);
        }

        // 2. Exact 80/20 Fee Calculation using BigDecimal
        BigDecimal platformFee = amount.multiply(new BigDecimal("0.20")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal partnerEarnings = amount.subtract(platformFee);

        // 3. Immutable Ledger Entry: Platform Fee
        String feeIdempotency = "LEDGER-FEE-" + payment.getId();
        if (!ledgerRepository.existsByIdempotencyKey(feeIdempotency)) {
            FinancialLedgerEntry feeEntry = FinancialLedgerEntry.builder()
                    .payment(payment)
                    .workRequest(wr)
                    .partner(wr.getAssignedPartner())
                    .entryType("PLATFORM_FEE")
                    .amount(platformFee)
                    .currency("INR")
                    .idempotencyKey(feeIdempotency)
                    .build();
            ledgerRepository.save(feeEntry);
        }

        // 4. Immutable Ledger Entry: Partner Earnings (80% Net)
        String earnIdempotency = "LEDGER-EARN-" + payment.getId();
        if (!ledgerRepository.existsByIdempotencyKey(earnIdempotency)) {
            FinancialLedgerEntry earnEntry = FinancialLedgerEntry.builder()
                    .payment(payment)
                    .workRequest(wr)
                    .partner(wr.getAssignedPartner())
                    .entryType("PARTNER_EARNING")
                    .amount(partnerEarnings)
                    .currency("INR")
                    .idempotencyKey(earnIdempotency)
                    .build();
            ledgerRepository.save(earnEntry);
        }

        // 5. Update Denormalized WorkRequest fields
        wr.setPaymentStatus("PAID");
        wr.setPaidAt(LocalDateTime.now());
        wr.setPaidAmount(amount);
        wr.setPlatformFee(platformFee);
        wr.setPartnerNetEarning(partnerEarnings);
        wr.setPaymentMethod(safeMethod);
        workRequestRepository.save(wr);

        // 6. Record Audit Event
        WorkRequestEvent event = WorkRequestEvent.builder()
                .workRequest(wr)
                .fromStatus(wr.getStatus() != null ? wr.getStatus().name() : "COMPLETED")
                .toStatus(wr.getStatus() != null ? wr.getStatus().name() : "COMPLETED")
                .actor(wr.getCustomer())
                .actorRole("CUSTOMER")
                .notes("Payment settled: ₹" + amount + " via " + safeMethod + " (Platform fee: ₹" + platformFee + ", Partner net: ₹" + partnerEarnings + ")")
                .build();
        eventRepository.save(event);

        log.info("Payment settled for WorkRequest: {} | Total: ₹{} | Net: ₹{}", workRequestId, amount, partnerEarnings);
        return payment;
    }

    public List<FinancialLedgerEntry> getPartnerLedger(Long partnerId) {
        return ledgerRepository.findByPartnerIdOrderByCreatedAtDesc(partnerId);
    }

    public BigDecimal getPartnerTotalEarnings(Long partnerId) {
        return ledgerRepository.calculateTotalPartnerEarnings(partnerId);
    }
}
