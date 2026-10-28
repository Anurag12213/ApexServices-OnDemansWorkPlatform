package com.apexservices.repository;

import com.apexservices.model.FinancialLedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface FinancialLedgerEntryRepository extends JpaRepository<FinancialLedgerEntry, Long> {

    List<FinancialLedgerEntry> findByPartnerIdOrderByCreatedAtDesc(Long partnerId);

    List<FinancialLedgerEntry> findByWorkRequestIdOrderByCreatedAtDesc(String workRequestId);

    Optional<FinancialLedgerEntry> findByIdempotencyKey(String idempotencyKey);

    boolean existsByIdempotencyKey(String idempotencyKey);

    @Query("SELECT COALESCE(SUM(l.amount), 0.0) FROM FinancialLedgerEntry l WHERE l.partner.id = :partnerId AND l.entryType = 'PARTNER_EARNING'")
    BigDecimal calculateTotalPartnerEarnings(@Param("partnerId") Long partnerId);
}
