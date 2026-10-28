package com.apexservices.repository;

import com.apexservices.model.Payment;
import com.apexservices.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByWorkRequestIdOrderByCreatedAtDesc(String workRequestId);

    Optional<Payment> findTopByWorkRequestIdAndStatusOrderByCreatedAtDesc(String workRequestId, PaymentStatus status);

    Optional<Payment> findByIdempotencyKey(String idempotencyKey);

    boolean existsByIdempotencyKey(String idempotencyKey);
}
