package com.apexservices.repository;

import com.apexservices.model.WorkRequestRejection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkRequestRejectionRepository extends JpaRepository<WorkRequestRejection, Long> {

    boolean existsByWorkRequestIdAndPartnerId(String workRequestId, Long partnerId);

    Optional<WorkRequestRejection> findByWorkRequestIdAndPartnerId(String workRequestId, Long partnerId);

    List<WorkRequestRejection> findByWorkRequestId(String workRequestId);
}
