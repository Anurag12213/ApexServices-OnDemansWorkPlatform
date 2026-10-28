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

    Page<WorkRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<WorkRequest> findByStatusOrderByCreatedAtDesc(WorkRequestStatus status);

    /**
     * Find active broadcasted requests strictly matching the partner's assigned categories,
     * excluding requests rejected by this partner.
     */
    @Query("SELECT w FROM WorkRequest w WHERE w.status = com.apexservices.model.WorkRequestStatus.BROADCASTED " +
           "AND (w.expiresAt IS NULL OR w.expiresAt > :now) " +
           "AND (w.serviceCategoryId IN :categoryIds OR w.serviceCategory IN :categoryNames) " +
           "AND w.id NOT IN (SELECT r.workRequest.id FROM WorkRequestRejection r WHERE r.partner.id = :partnerId) " +
           "ORDER BY w.createdAt DESC")
    List<WorkRequest> findEligibleBroadcastsForPartnerCategories(
            @Param("partnerId") Long partnerId,
            @Param("categoryIds") List<Long> categoryIds,
            @Param("categoryNames") List<String> categoryNames,
            @Param("now") LocalDateTime now
    );

    /**
     * Find active broadcasted requests matching category that have not been rejected by this partner.
     */
    @Query("SELECT w FROM WorkRequest w WHERE w.status = com.apexservices.model.WorkRequestStatus.BROADCASTED " +
           "AND (w.expiresAt IS NULL OR w.expiresAt > :now) " +
           "AND (:category IS NULL OR :category = '' OR w.serviceCategory = :category) " +
           "AND w.id NOT IN (SELECT r.workRequest.id FROM WorkRequestRejection r WHERE r.partner.id = :partnerId) " +
           "ORDER BY w.createdAt DESC")
    List<WorkRequest> findEligibleBroadcastsForPartner(
            @Param("partnerId") Long partnerId,
            @Param("category") String category,
            @Param("now") LocalDateTime now
    );

    /**
     * Atomic claim operation executing conditional write lock query:
     * Only succeeds if status is BROADCASTED and not yet expired.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE WorkRequest w SET w.status = com.apexservices.model.WorkRequestStatus.ASSIGNED, " +
           "w.assignedPartner = :partner, w.assignedPartnerName = :partnerName, " +
           "w.assignedPartnerPhone = :partnerPhone, w.assignedPartnerRating = :partnerRating, " +
           "w.assignedPartnerPhoto = :partnerPhoto, w.claimedAt = :claimedAt, w.stage = 2 " +
           "WHERE w.id = :id AND w.status = com.apexservices.model.WorkRequestStatus.BROADCASTED " +
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
     * Atomic expiration update: Transitions pending requests past their deadline to EXPIRED.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE WorkRequest w SET w.status = com.apexservices.model.WorkRequestStatus.EXPIRED " +
           "WHERE w.status = com.apexservices.model.WorkRequestStatus.BROADCASTED AND w.expiresAt <= :now")
    int expireOverdueRequests(@Param("now") LocalDateTime now);

    /**
     * Dynamically propagates an updated partner profile avatar to all assigned work requests.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE WorkRequest w SET w.assignedPartnerPhoto = :avatarUrl WHERE w.assignedPartner.id = :partnerId")
    int updateAssignedPartnerPhotoForPartner(@Param("partnerId") Long partnerId, @Param("avatarUrl") String avatarUrl);
}
