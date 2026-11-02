package com.apexservices.repository;

import com.apexservices.model.PartnerPayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartnerPayoutRepository extends JpaRepository<PartnerPayout, String> {
    List<PartnerPayout> findByPartnerIdOrderByCreatedAtDesc(Long partnerId);
    List<PartnerPayout> findAllByOrderByCreatedAtDesc();
}
