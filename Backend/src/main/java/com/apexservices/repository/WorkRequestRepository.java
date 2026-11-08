package com.apexservices.repository;

import com.apexservices.model.User;
import com.apexservices.model.WorkRequest;
import com.apexservices.model.WorkRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkRequestRepository extends JpaRepository<WorkRequest, String> {

    List<WorkRequest> findByCustomerEmailOrderByCreatedAtDesc(String email);

    List<WorkRequest> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<WorkRequest> findByAssignedPartnerIdOrderByCreatedAtDesc(Long partnerId);

    List<WorkRequest> findByAssignedPartnerIdAndStatusInOrderByCreatedAtDesc(Long partnerId, List<WorkRequestStatus> statuses);

    List<WorkRequest> findAllByOrderByCreatedAtDesc();

    Page<WorkRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<WorkRequest> findByStatusOrderByCreatedAtDesc(WorkRequestStatus status);

    Page<WorkRequest> findByStatusOrderByCreatedAtDesc(WorkRequestStatus status, Pageable pageable);

    Page<WorkRequest> findByStatusInOrderByCreatedAtDesc(List<WorkRequestStatus> statuses, Pageable pageable);

    long countByStatus(WorkRequestStatus status);

    long countByStatusIn(List<WorkRequestStatus> statuses);

    @Query("SELECT COALESCE(SUM(w.paidAmount), 0) FROM WorkRequest w WHERE w.paymentStatus = 'PAID'")
    java.math.BigDecimal sumTotalPaidRevenue();

    @Query("SELECT COALESCE(SUM(w.platformFee), 0) FROM WorkRequest w WHERE w.paymentStatus = 'PAID'")
    java.math.BigDecimal sumTotalPlatformFee();

    @Query("SELECT COALESCE(SUM(w.partnerNetEarning), 0) FROM WorkRequest w WHERE w.paymentStatus = 'PAID'")
    java.math.BigDecimal sumTotalPartnerNetEarning();

    /**
     * Post & Pick: Find all available published jobs matching partner's eligible categories.
     * Accessible by all eligible partners without individual broadcast dispatch.
     */
    @Query("SELECT w FROM WorkRequest w WHERE (w.status = com.apexservices.model.WorkRequestStatus.POSTED OR w.status = com.apexservices.model.WorkRequestStatus.BROADCASTED) " +
           "AND (w.expiresAt IS NULL OR w.expiresAt > :now) " +
           "AND (:hasCategories = false OR w.serviceCategoryId IN :categoryIds OR w.serviceCategory IN :categoryNames) " +
           "ORDER BY w.createdAt DESC")
    List<WorkRequest> findAvailablePublishedJobsForCategories(
            @Param("categoryIds") List<Long> categoryIds,
            @Param("categoryNames") List<String> categoryNames,
            @Param("hasCategories") boolean hasCategories,
            @Param("now") LocalDateTime now
    );

    /**
     * Post & Pick: Find all available published jobs across all categories.
     */
    @Query("SELECT w FROM WorkRequest w WHERE (w.status = com.apexservices.model.WorkRequestStatus.POSTED OR w.status = com.apexservices.model.WorkRequestStatus.BROADCASTED) " +
           "AND (w.expiresAt IS NULL OR w.expiresAt > :now) " +
           "ORDER BY w.createdAt DESC")
    List<WorkRequest> findAllAvailablePublishedJobs(@Param("now") LocalDateTime now);

    /**
     * Post & Pick: Atomic claim/acceptance.
     * Guaranteed single-winner semantics: Only succeeds if status is POSTED or BROADCASTED.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE WorkRequest w SET w.status = com.apexservices.model.WorkRequestStatus.ASSIGNED, " +
           "w.assignedPartner = :partner, w.assignedPartnerName = :partnerName, " +
           "w.assignedPartnerPhone = :partnerPhone, w.assignedPartnerRating = :partnerRating, " +
           "w.assignedPartnerPhoto = :partnerPhoto, w.claimedAt = :claimedAt, w.stage = 2 " +
           "WHERE w.id = :id AND (w.status = com.apexservices.model.WorkRequestStatus.POSTED OR w.status = com.apexservices.model.WorkRequestStatus.BROADCASTED) " +
           "AND (w.expiresAt IS NULL OR w.expiresAt > :claimedAt)")
    int claimRequestAtomically(
            @Param("id") String id,
            @Param("partner") User partner,
            @Param("partnerName") String partnerName,
            @Param("partnerPhone") String partnerPhone,
            @Param("partnerRating") String partnerRating,
            @Param("partnerPhoto") String partnerPhoto,
            @Param("claimedAt") LocalDateTime claimedAt
    );

    /**
     * Legacy broadcast support (backward compatibility).
     */
    @Query("SELECT w FROM WorkRequest w WHERE (w.status = com.apexservices.model.WorkRequestStatus.POSTED OR w.status = com.apexservices.model.WorkRequestStatus.BROADCASTED) " +
           "AND (w.expiresAt IS NULL OR w.expiresAt > :now) " +
           "AND (w.serviceCategoryId IN :categoryIds OR w.serviceCategory IN :categoryNames) " +
           "ORDER BY w.createdAt DESC")
    List<WorkRequest> findEligibleBroadcastsForPartnerCategories(
            @Param("partnerId") Long partnerId,
            @Param("categoryIds") List<Long> categoryIds,
            @Param("categoryNames") List<String> categoryNames,
            @Param("now") LocalDateTime now
    );

    @Query("SELECT w FROM WorkRequest w WHERE (w.status = com.apexservices.model.WorkRequestStatus.POSTED OR w.status = com.apexservices.model.WorkRequestStatus.BROADCASTED) " +
           "AND (w.expiresAt IS NULL OR w.expiresAt > :now) " +
           "AND (:category IS NULL OR :category = '' OR w.serviceCategory = :category) " +
           "ORDER BY w.createdAt DESC")
    List<WorkRequest> findEligibleBroadcastsForPartner(
            @Param("partnerId") Long partnerId,
            @Param("category") String category,
            @Param("now") LocalDateTime now
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE WorkRequest w SET w.status = com.apexservices.model.WorkRequestStatus.EXPIRED " +
           "WHERE (w.status = com.apexservices.model.WorkRequestStatus.POSTED OR w.status = com.apexservices.model.WorkRequestStatus.BROADCASTED) AND w.expiresAt <= :now")
    int expireOverdueRequests(@Param("now") LocalDateTime now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE WorkRequest w SET w.assignedPartnerPhoto = :avatarUrl WHERE w.assignedPartner.id = :partnerId")
    int updateAssignedPartnerPhotoForPartner(@Param("partnerId") Long partnerId, @Param("avatarUrl") String avatarUrl);
}
