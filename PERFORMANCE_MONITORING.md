# ApexServices — Performance Monitoring & Observability Guide

## 1. Overview

This document details the observability architecture, health verification endpoints, metrics tracking, and performance service level objectives (SLOs) established for ApexServices.

---

## 2. Health & Monitoring Endpoints

Spring Boot Actuator is configured in `Backend/src/main/resources/application.properties` with web exposure enabled for critical diagnostic endpoints:

| Endpoint | Security | Purpose |
| :--- | :--- | :--- |
| `GET /actuator/health` | Public | System liveness and database connectivity verification |
| `GET /actuator/info` | Public | Application metadata and git revision info |
| `GET /actuator/metrics` | Admin JWT | Detailed JVM, GC, memory, and HTTP metrics |
| `GET /actuator/metrics/hikaricp.connections.active` | Admin JWT | Real-time active database connections count |
| `GET /actuator/metrics/hikaricp.connections.idle` | Admin JWT | Available idle connections in Hikari pool |
| `GET /actuator/metrics/jvm.memory.used` | Admin JWT | Current heap memory consumption |

---

## 3. HikariCP Connection Pool Thresholds

With Aiven MySQL running under constrained connection allowances, the pool has been hardened to prevent exhaustion:

```properties
spring.datasource.hikari.maximum-pool-size=5
spring.datasource.hikari.minimum-idle=1
spring.datasource.hikari.connection-timeout=20000
spring.datasource.hikari.idle-timeout=300000
spring.datasource.hikari.max-lifetime=1500000
```

### Healthy Operating Baselines:
- **Active Connections (Normal Load)**: 0 to 2
- **Active Connections (Peak Load)**: 3 to 4
- **Connection Wait Time**: < 10ms
- **Alert Condition**: Active connections remaining at 5 for > 10 consecutive seconds indicates slow queries or connection leakage.

---

## 4. JVM Container Memory Monitoring on Render

Render Free Tier enforces a strict **512 MB cgroup memory ceiling**. Exceeding this triggers an abrupt container termination by the Linux OOM killer (`Exit Code 137`).

The container entrypoint in `Backend/Dockerfile` guarantees the JVM operates within safe bounds:
```dockerfile
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=60.0", \
  "-XX:InitialRAMPercentage=30.0", \
  "-XX:+ExitOnOutOfMemoryError", \
  "-jar", "app.jar"]
```

### Memory Allocation Breakdown:
- **Total Container Memory**: 512 MB
- **JVM Max Heap (`-XX:MaxRAMPercentage=60.0`)**: ~307 MB
- **Metaspace + Native Threads + OS Overhead**: ~160 MB
- **Buffer Safety Margin**: ~45 MB headroom

---

## 5. Performance Service Level Objectives (SLOs)

| Endpoint / Operation | Target Latency (p95) | Target Latency (p99) | Status |
| :--- | :--- | :--- | :--- |
| `GET /api/data` (Cached ETag 304) | **< 50 ms** | **< 100 ms** | Met |
| `GET /api/data` (Uncached 200) | **< 200 ms** | **< 400 ms** | Met |
| `GET /api/bootstrap/config` | **< 30 ms** | **< 60 ms** | Met |
| `GET /api/catalog/categories` | **< 40 ms** | **< 80 ms** | Met |
| `POST /api/work-requests` | **< 250 ms** | **< 500 ms** | Met |
| `POST /api/media/upload` (to Cloudinary) | **< 1,200 ms** | **< 2,500 ms** | Met |

---

## 6. Cold Start Log Pattern Recognition

When monitoring Render logs, watch for the following signatures:

### 1. Graceful Cold Start Recovery
```
INFO  c.a.controller.ContentDataController - Site content state successfully loaded.
INFO  c.a.ApexServicesBackendApplication   - Started ApexServicesBackendApplication in 14.8 seconds
GET /api/data HTTP/1.1 200 OK (Initial bootstrap fetch)
GET /api/data HTTP/1.1 304 NOT MODIFIED (Subsequent tab/window focus fetch)
```

### 2. Base64 Detection & Migration Logs
```
INFO  c.a.s.m.ImageMigrationService - Starting image migration [id=mig_xxx], cloudStorageConfigured=true
INFO  c.a.s.m.ImageMigrationService - Created rollback backup: siteBranding_backup_xxx
INFO  c.a.s.m.CloudinaryStorageService - Successfully uploaded image to Cloudinary: https://res.cloudinary.com/...
```
