package com.apexservices.repository;

import com.apexservices.model.AuthProvider;
import com.apexservices.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByMobileNumber(String mobileNumber);

    Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);

    boolean existsByEmail(String email);

    boolean existsByMobileNumber(String mobileNumber);

    @Query("SELECT u FROM User u WHERE (u.email IS NOT NULL AND u.email = :identifier) OR (u.mobileNumber IS NOT NULL AND u.mobileNumber = :identifier)")
    Optional<User> findByIdentifier(@Param("identifier") String identifier);

    java.util.List<User> findByRole(com.apexservices.model.Role role);

    @Query("SELECT DISTINCT u FROM User u JOIN u.serviceCategories c WHERE u.role = com.apexservices.model.Role.ROLE_PARTNER AND u.active = true AND c.id = :categoryId")
    java.util.List<User> findEligiblePartnersByCategoryId(@Param("categoryId") Long categoryId);

    @Query("SELECT DISTINCT c.id FROM User u JOIN u.serviceCategories c WHERE u.id = :partnerId")
    java.util.List<Long> findCategoryIdsByPartnerId(@Param("partnerId") Long partnerId);

    @Query("SELECT DISTINCT c.name FROM User u JOIN u.serviceCategories c WHERE u.id = :partnerId")
    java.util.List<String> findCategoryNamesByPartnerId(@Param("partnerId") Long partnerId);
}
