package com.apexservices.repository;

import com.apexservices.model.Icon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IconRepository extends JpaRepository<Icon, Long> {
    Optional<Icon> findByName(String name);
    Optional<Icon> findByIconValue(String iconValue);
}
