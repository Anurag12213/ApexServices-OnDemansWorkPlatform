package com.apexservices.repository;

import com.apexservices.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Optional<Review> findByWorkRequestId(String workRequestId);

    boolean existsByWorkRequestId(String workRequestId);

    List<Review> findByPartnerIdAndStatusOrderByCreatedAtDesc(Long partnerId, String status);

    List<Review> findByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.partner.id = :partnerId AND r.status = 'PUBLISHED'")
    long countPublishedReviewsByPartnerId(@Param("partnerId") Long partnerId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.partner.id = :partnerId AND r.status = 'PUBLISHED'")
    Double averageRatingByPartnerId(@Param("partnerId") Long partnerId);
}
