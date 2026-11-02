package com.apexservices.repository;

import com.apexservices.model.PartnerDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartnerDocumentRepository extends JpaRepository<PartnerDocument, String> {
    List<PartnerDocument> findByPartnerIdOrderByUploadedAtDesc(Long partnerId);
    List<PartnerDocument> findByStatusOrderByUploadedAtDesc(String status);
}
