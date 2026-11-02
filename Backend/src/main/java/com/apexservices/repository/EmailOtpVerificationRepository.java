package com.apexservices.repository;

import com.apexservices.model.EmailOtpVerification;
import com.apexservices.model.OtpPurpose;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EmailOtpVerificationRepository extends JpaRepository<EmailOtpVerification, Long> {

    /**
     * Retrieves the latest active unconsumed OTP challenge for an email and purpose.
     */
    Optional<EmailOtpVerification> findTopByEmailAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
            String email, OtpPurpose purpose
    );

    /**
     * Atomically retrieves the active challenge row using pessimistic write locking (SELECT ... FOR UPDATE).
     * Prevents race conditions and brute-force attempt counter bypassing.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM EmailOtpVerification e WHERE e.email = :email AND e.purpose = :purpose AND e.consumedAt IS NULL ORDER BY e.createdAt DESC LIMIT 1")
    Optional<EmailOtpVerification> findActiveChallengeWithLock(
            @Param("email") String email,
            @Param("purpose") OtpPurpose purpose
    );

    /**
     * Atomically invalidates all prior unconsumed challenges for a given email and purpose.
     */
    @Modifying
    @Query("UPDATE EmailOtpVerification e SET e.consumedAt = :now WHERE e.email = :email AND e.purpose = :purpose AND e.consumedAt IS NULL")
    int invalidatePriorChallenges(
            @Param("email") String email,
            @Param("purpose") OtpPurpose purpose,
            @Param("now") LocalDateTime now
    );

    /**
     * Counts the total number of OTP challenges generated for an email within a rolling time window.
     */
    @Query("SELECT COUNT(e) FROM EmailOtpVerification e WHERE e.email = :email AND e.createdAt >= :windowStart")
    long countChallengesInWindow(
            @Param("email") String email,
            @Param("windowStart") LocalDateTime windowStart
    );

    /**
     * Atomically finds and locks a verified, unconsumed verification grant row for consumption.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM EmailOtpVerification e WHERE e.email = :email AND e.purpose = :purpose AND e.grantHash = :grantHash AND e.verifiedAt IS NOT NULL AND e.consumedAt IS NULL AND e.grantExpiresAt > :now")
    Optional<EmailOtpVerification> findValidGrantWithLock(
            @Param("email") String email,
            @Param("purpose") OtpPurpose purpose,
            @Param("grantHash") String grantHash,
            @Param("now") LocalDateTime now
    );
}
