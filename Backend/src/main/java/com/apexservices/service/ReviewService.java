package com.apexservices.service;

import com.apexservices.exception.ConflictException;
import com.apexservices.model.*;
import com.apexservices.repository.PartnerProfileRepository;
import com.apexservices.repository.ReviewRepository;
import com.apexservices.repository.UserRepository;
import com.apexservices.repository.WorkRequestRepository;
import com.apexservices.security.InputSanitizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
public class ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewService.class);

    private final ReviewRepository reviewRepository;
    private final WorkRequestRepository workRequestRepository;
    private final UserRepository userRepository;
    private final PartnerProfileRepository partnerProfileRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            WorkRequestRepository workRequestRepository,
            UserRepository userRepository,
            PartnerProfileRepository partnerProfileRepository) {
        this.reviewRepository = reviewRepository;
        this.workRequestRepository = workRequestRepository;
        this.userRepository = userRepository;
        this.partnerProfileRepository = partnerProfileRepository;
    }

    /**
     * Submits a customer review for a completed work request.
     * Enforces single review per work request and recalculates partner's authoritative metrics.
     */
    @Transactional
    public Review submitReview(String workRequestId, int rating, String reviewText, String customerEmail) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5 stars");
        }

        WorkRequest wr = workRequestRepository.findById(workRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Work request not found: " + workRequestId));

        // 1. Authorization: Only the customer who booked can review
        if (customerEmail != null && wr.getCustomerEmail() != null
                && !wr.getCustomerEmail().equalsIgnoreCase(customerEmail.trim())) {
            throw new IllegalArgumentException("You are not authorized to review this service request");
        }

        // 2. State Validation: Can only review completed or closed service
        if (wr.getStatus() != WorkRequestStatus.COMPLETED && wr.getStatus() != WorkRequestStatus.CLOSED) {
            throw new ConflictException("Service request must be completed before submitting a review", "SERVICE_NOT_COMPLETED");
        }

        // 3. Unique review guard
        if (reviewRepository.existsByWorkRequestId(workRequestId)) {
            throw new ConflictException("A review has already been submitted for this service request", "DUPLICATE_REVIEW");
        }

        User partner = wr.getAssignedPartner();
        if (partner == null) {
            throw new IllegalStateException("Cannot review a request with no assigned partner");
        }

        User customer = wr.getCustomer();
        if (customer == null && customerEmail != null) {
            customer = userRepository.findByEmail(customerEmail.trim().toLowerCase()).orElse(null);
        }
        if (customer == null) {
            // Fallback to customer owner by ID or default user if guest
            customer = userRepository.findById(1L).orElse(partner);
        }

        String sanitizedText = reviewText != null ? InputSanitizer.sanitize(reviewText.trim()) : "";

        Review review = Review.builder()
                .workRequest(wr)
                .customer(customer)
                .partner(partner)
                .rating(rating)
                .reviewText(sanitizedText)
                .status("PUBLISHED")
                .build();

        review = reviewRepository.save(review);

        // Recalculate Partner Profile Metrics from published reviews
        recalculatePartnerRating(partner.getId());

        // Update Denormalized fields on WorkRequest for convenience
        wr.setAssignedPartnerRating(formatPartnerRating(partner.getId()));
        workRequestRepository.save(wr);

        log.info("Review submitted for WorkRequest: {} by customer: {}", workRequestId, customerEmail);
        return review;
    }

    /**
     * Recalculates partner's rating and review count directly from published reviews.
     */
    @Transactional
    public void recalculatePartnerRating(Long partnerId) {
        long count = reviewRepository.countPublishedReviewsByPartnerId(partnerId);
        Double avg = reviewRepository.averageRatingByPartnerId(partnerId);

        BigDecimal avgRating = avg != null ? BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP) : new BigDecimal("5.00");

        PartnerProfile profile = partnerProfileRepository.findByUserId(partnerId)
                .orElseGet(() -> {
                    User partner = userRepository.findById(partnerId)
                            .orElseThrow(() -> new IllegalArgumentException("Partner not found: " + partnerId));
                    return PartnerProfile.builder()
                            .user(partner)
                            .rating(new BigDecimal("5.00"))
                            .reviewCount(0)
                            .build();
                });

        profile.setReviewCount((int) count);
        profile.setRating(avgRating);
        partnerProfileRepository.save(profile);

        log.info("Recalculated metrics for partnerId: {} -> Rating: {}, Count: {}", partnerId, avgRating, count);
    }

    public String formatPartnerRating(Long partnerId) {
        long count = reviewRepository.countPublishedReviewsByPartnerId(partnerId);
        if (count == 0) {
            return "No reviews yet";
        }
        Double avg = reviewRepository.averageRatingByPartnerId(partnerId);
        double val = avg != null ? avg : 5.0;
        return String.format("%.1f (%d reviews)", val, count);
    }

    public List<Review> getPartnerReviews(Long partnerId) {
        return reviewRepository.findByPartnerIdAndStatusOrderByCreatedAtDesc(partnerId, "PUBLISHED");
    }

    public List<Review> getAllPublishedReviews() {
        return reviewRepository.findByStatusOrderByCreatedAtDesc("PUBLISHED");
    }

    public List<Review> getAllReviewsForAdmin() {
        return reviewRepository.findAll();
    }

    @Transactional
    public Review moderateReview(Long reviewId, String newStatus) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));
        review.setStatus(newStatus.toUpperCase());
        review = reviewRepository.save(review);
        recalculatePartnerRating(review.getPartner().getId());
        return review;
    }
}
