package com.apexservices.repository;

import com.apexservices.model.WorkRequestBroadcast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkRequestBroadcastRepository extends JpaRepository<WorkRequestBroadcast, Long> {

    boolean existsByWorkRequestIdAndPartnerId(String workRequestId, Long partnerId);

    List<WorkRequestBroadcast> findByWorkRequestId(String workRequestId);

    List<WorkRequestBroadcast> findByPartnerId(Long partnerId);
}
