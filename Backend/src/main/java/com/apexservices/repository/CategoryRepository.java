package com.apexservices.repository;

import com.apexservices.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findAllByOrderByIdAsc();

    List<Category> findByActiveTrueOrderByIdAsc();

    Optional<Category> findBySlug(String slug);

    Optional<Category> findByNameIgnoreCase(String name);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @Query(value = "SELECT COUNT(*) FROM partner_service_categories WHERE category_id = :categoryId", nativeQuery = true)
    long countPartnersByCategoryId(@Param("categoryId") Long categoryId);

    @Query("SELECT COUNT(w) FROM WorkRequest w WHERE w.serviceCategoryId = :categoryId OR w.serviceCategory = :categoryName")
    long countRequestsByCategoryIdAndName(@Param("categoryId") Long categoryId, @Param("categoryName") String categoryName);
}

