package com.apexservices.repository;

import com.apexservices.model.CompletionVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompletionVerificationRepository extends JpaRepository<CompletionVerification, Long> {

    Optional<CompletionVerification> findTopByWorkRequestIdAndConsumedAtIsNullOrderByCreatedAtDesc(String workRequestId);

    Optional<CompletionVerification> findTopByWorkRequestIdOrderByCreatedAtDesc(String workRequestId);

    List<CompletionVerification> findByWorkRequestIdOrderByCreatedAtDesc(String workRequestId);
}
