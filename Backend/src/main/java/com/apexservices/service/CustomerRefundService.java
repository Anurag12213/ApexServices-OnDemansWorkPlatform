package com.apexservices.service;

import com.apexservices.model.CustomerRefund;
import com.apexservices.model.WorkRequest;
import com.apexservices.model.WorkRequestStatus;
import com.apexservices.repository.CustomerRefundRepository;
import com.apexservices.repository.WorkRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerRefundService {

    private final CustomerRefundRepository refundRepository;
    private final WorkRequestRepository workRequestRepository;
    private final AuditLogService auditLogService;

    public List<CustomerRefund> getAllRefunds() {
        return refundRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<CustomerRefund> getRefundsForCustomer(Long customerId) {
        return refundRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    @Transactional
    public CustomerRefund requestRefund(
            String workRequestId,
            Long customerId,
            String customerName,
            BigDecimal amount,
            String reason
    ) {
        CustomerRefund refund = CustomerRefund.builder()
                .id("REF-" + (System.currentTimeMillis() % 1000000))
                .workRequestId(workRequestId)
                .customerId(customerId)
                .customerName(customerName != null ? customerName : "Customer")
                .amount(amount != null ? amount : new BigDecimal("499.00"))
                .reason(reason != null ? reason : "Dispute resolution claim")
                .status("REQUESTED")
                .createdAt(LocalDateTime.now())
                .build();

        CustomerRefund saved = refundRepository.save(refund);

        // Mark work request as disputed if still active
        workRequestRepository.findById(workRequestId).ifPresent(wr -> {
            wr.setStatus(WorkRequestStatus.CANCELLED);
            workRequestRepository.save(wr);
        });

        auditLogService.record(
                customerId != null ? customerId.toString() : "CLIENT",
                "CUSTOMER",
                "REFUND_REQUESTED",
                "FINANCIAL_REFUND",
                saved.getId(),
                "Refund claim requested for order " + workRequestId + " (Amount: ₹" + refund.getAmount().toPlainString() + ")",
                "127.0.0.1"
        );

        return saved;
    }

    @Transactional
    public CustomerRefund updateRefundStatus(String refundId, String action, String txnRef, String actor) {
        CustomerRefund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new IllegalArgumentException("Refund claim not found: " + refundId));

        if ("APPROVE".equalsIgnoreCase(action)) {
            refund.setStatus("APPROVED");
            refund.setProcessedBy(actor);
        } else if ("SETTLE".equalsIgnoreCase(action)) {
            refund.setStatus("SETTLED");
            refund.setTransactionReference(txnRef != null ? txnRef : "REF-TXN-" + System.currentTimeMillis());
            refund.setSettledAt(LocalDateTime.now());
        } else if ("REJECT".equalsIgnoreCase(action)) {
            refund.setStatus("REJECTED");
            refund.setProcessedBy(actor);
        }

        CustomerRefund saved = refundRepository.save(refund);

        auditLogService.record(
                actor != null ? actor : "ADMIN",
                "ADMIN",
                "REFUND_" + action.toUpperCase(),
                "FINANCIAL_REFUND",
                refundId,
                "Refund " + refundId + " status updated to " + refund.getStatus(),
                "127.0.0.1"
        );

        return saved;
    }
}
