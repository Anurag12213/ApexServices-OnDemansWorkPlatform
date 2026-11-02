package com.apexservices.service;

import com.apexservices.model.AuditLog;
import com.apexservices.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public AuditLog record(String actorId, String actorRole, String action, String entityType, String entityId, String details, String ipAddress) {
        try {
            AuditLog entry = AuditLog.builder()
                    .id("AUD-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase())
                    .actorId(actorId != null ? actorId : "SYSTEM")
                    .actorRole(actorRole != null ? actorRole : "ADMIN")
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .details(details)
                    .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                    .createdAt(LocalDateTime.now())
                    .build();

            return auditLogRepository.save(entry);
        } catch (Exception e) {
            log.warn("Failed to persist audit log entry: {}", e.getMessage());
            return null;
        }
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop200ByOrderByCreatedAtDesc();
    }

    public Page<AuditLog> getLogsPaged(int page, int size) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }
}
