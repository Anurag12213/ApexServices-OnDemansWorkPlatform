package com.apexservices.repository;

import com.apexservices.model.CustomerRefund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRefundRepository extends JpaRepository<CustomerRefund, String> {
    List<CustomerRefund> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<CustomerRefund> findByWorkRequestIdOrderByCreatedAtDesc(String workRequestId);
    List<CustomerRefund> findAllByOrderByCreatedAtDesc();
}
