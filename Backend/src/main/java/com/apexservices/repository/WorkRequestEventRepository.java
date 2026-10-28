package com.apexservices.repository;

import com.apexservices.model.WorkRequestEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkRequestEventRepository extends JpaRepository<WorkRequestEvent, Long> {

    List<WorkRequestEvent> findByWorkRequestIdOrderByCreatedAtAsc(String workRequestId);

    List<WorkRequestEvent> findByWorkRequestIdOrderByCreatedAtDesc(String workRequestId);
}
