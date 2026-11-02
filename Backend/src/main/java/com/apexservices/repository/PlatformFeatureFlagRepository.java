package com.apexservices.repository;

import com.apexservices.model.PlatformFeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlatformFeatureFlagRepository extends JpaRepository<PlatformFeatureFlag, String> {
    List<PlatformFeatureFlag> findByIsPublicTrue();
}
