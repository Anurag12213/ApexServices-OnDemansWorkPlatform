package com.apexservices.repository;

import com.apexservices.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, String> {
    List<UserSession> findByUserIdAndRevokedFalse(Long userId);
    List<UserSession> findAllByOrderByLastActiveAtDesc();
}
