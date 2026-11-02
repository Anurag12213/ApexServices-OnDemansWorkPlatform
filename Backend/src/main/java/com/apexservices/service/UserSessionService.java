package com.apexservices.service;

import com.apexservices.model.User;
import com.apexservices.model.UserSession;
import com.apexservices.repository.UserRepository;
import com.apexservices.repository.UserSessionRepository;
import com.apexservices.security.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserSessionService {

    private final UserSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final TokenBlacklistService tokenBlacklistService;
    private final AuditLogService auditLogService;

    public List<UserSession> getAllActiveSessions() {
        return sessionRepository.findAllByOrderByLastActiveAtDesc();
    }

    @Transactional
    public UserSession recordSession(Long userId, String email, String role, String deviceInfo, String browser, String ip) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return null;

        String sessionId = "SES-" + System.currentTimeMillis();
        UserSession session = UserSession.builder()
                .id(sessionId)
                .user(user)
                .userEmail(email)
                .role(role)
                .deviceInfo(deviceInfo != null ? deviceInfo : "Web Browser")
                .browser(browser != null ? browser : "Chrome")
                .ipAddress(ip != null ? ip : "127.0.0.1")
                .revoked(false)
                .lastActiveAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        return sessionRepository.save(session);
    }

    @Transactional
    public void revokeSession(String sessionId, String actor) {
        sessionRepository.findById(sessionId).ifPresent(s -> {
            s.setRevoked(true);
            sessionRepository.save(s);

            auditLogService.record(
                    actor != null ? actor : "ADMIN",
                    "ADMIN",
                    "SESSION_REVOKED",
                    "SECURITY_SESSION",
                    sessionId,
                    "Revoked session for " + s.getUserEmail(),
                    s.getIpAddress()
            );
        });
    }

    @Transactional
    public void revokeAllUserSessions(Long userId, String actor) {
        List<UserSession> sessions = sessionRepository.findByUserIdAndRevokedFalse(userId);
        for (UserSession s : sessions) {
            s.setRevoked(true);
        }
        sessionRepository.saveAll(sessions);

        auditLogService.record(
                actor != null ? actor : "ADMIN",
                "ADMIN",
                "USER_SESSIONS_TERMINATED_ALL",
                "SECURITY_USER",
                userId.toString(),
                "Terminated all active sessions for user ID " + userId,
                "127.0.0.1"
        );
    }
}
