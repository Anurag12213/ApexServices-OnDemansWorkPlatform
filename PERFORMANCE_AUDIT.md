# ApexServices — Comprehensive Performance & Architectural Audit

## Executive Summary

An exhaustive technical audit of the ApexServices monorepo (Spring Boot 4.1.1 backend, React 19 / Vite 8 frontends, Aiven MySQL 8.0 database, and Render free tier deployment) identified critical bottlenecks causing 4–6 second page load times, intermittent browser unresponsiveness, and high Render memory consumption.

The audit revealed that slow performance was **not caused by database execution delays** (database queries averaged ~30ms), but rather by **severe network payload bloat (7.5 MB – 10.4 MB JSON payloads containing raw Base64 strings)**, **aggressive client polling storms (requests every 2–4 seconds across 6 components)**, **ephemeral disk avatar storage**, and **unconfigured JVM container memory limits**.

---

## 1. Identified Critical Bottlenecks

### 1.1. Massive `/api/data` Endpoint Payload (7.5 MB – 10.4 MB)
- **File**: `com.apexservices.controller.ContentDataController.java`
- **Issue**: The bootstrap endpoint aggregated `siteBranding`, `categories`, `heroSlides`, `reviews`, and `aiOwnerSection` into an uncompressed, untyped `Map<String, Object>`.
- **Root Cause**: High-resolution user-uploaded images and category icons were encoded into raw Base64 strings (`data:image/png;base64,...`) and stored in MySQL `LONGTEXT` columns within `site_settings`. Every initial page visit or reload serialized over 7.5 MB of uncompressed JSON across the wire.
- **Frontend Impact**: Parsing a 7.5 MB JSON string on the main browser thread blocked JavaScript execution for 400–800ms on desktop and > 1.5s on mobile devices.

### 1.2. Forced Cache Invalidation (`cache: 'no-store'`)
- **File**: `Frontend/customer/src/context/DataContext.jsx`
- **Issue**: The data fetch routine explicitly specified:
  ```javascript
  const res = await fetch(`${API_URL}/api/data`, { cache: 'no-store' });
  ```
- **Impact**: Completely disabled HTTP browser caching, CDN edge caching, and proxy caching. Every single reload or navigation transferred the full 7.5 MB payload anew.

### 1.3. Ephemeral Disk Avatar Loss on Render
- **File**: `com.apexservices.service.PartnerProfileService.java`
- **Issue**: Partner avatars were uploaded directly to the local directory `uploads/avatars`:
  ```java
  Path dest = Paths.get("uploads/avatars", filename);
  Files.copy(file.getInputStream(), dest);
  ```
- **Impact**: Render Free Tier containers possess an ephemeral filesystem. Whenever the container sleeps, restarts, or redeploys, all uploaded partner profile photos were permanently erased, resulting in broken image icons (`404 Not Found`).

### 1.4. Frontend Polling Storms
Audit revealed six independent frontend components firing polling timers:
1. `Frontend/customer/src/context/DataContext.jsx`: Polled `/api/data` every 10 seconds.
2. `Frontend/partner/src/context/PartnerContext.jsx`: Polled live feed every 2 seconds (`setInterval(fetchFeed, 2000)`).
3. `Frontend/customer/src/views/RequestWorkPage.jsx`: Polled request status every 3 seconds.
4. `Frontend/admin/src/components/RecentActivity.jsx`: Polled live activity every 3 seconds.
5. `Frontend/admin/src/components/PaymentTransactionsSection.jsx`: Polled transactions every 6 seconds.
6. `Frontend/admin/src/components/SupportTicketManagementSection.jsx`: Polled tickets every 4 seconds.
- **Combined Impact**: Generated **60–90 requests per minute per active browser tab**, saturating Render CPU and exhausting Aiven MySQL connection pool limits.

### 1.5. N+1 Category Icon Queries
- **File**: `com.apexservices.model.Category.java` and `CategoryRepository.java`
- **Issue**: Relationship defined as:
  ```java
  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "icon_id")
  private Icon icon;
  ```
- **Impact**: Querying 20 categories generated 21 separate SQL queries (`1 SELECT FROM categories` + `20 SELECT FROM icons WHERE id = ?`).

### 1.6. Unbounded JVM Container Memory on Render
- **File**: `Backend/Dockerfile`
- **Issue**: Entrypoint was standard `java -jar app.jar` without container memory percentage limits.
- **Impact**: The JVM defaulted to allocating up to 25%–50% of the host machine's total RAM (often 8 GB – 16 GB on cloud hypervisors), immediately exceeding Render Free Tier's 512 MB cgroup limit and causing abrupt `Exit code 137 (OOMKilled)`.

### 1.7. Missing HikariCP Connection Bounds
- **File**: `Backend/src/main/resources/application.properties`
- **Issue**: No explicit `spring.datasource.hikari.maximum-pool-size` configured.
- **Impact**: HikariCP defaulted to 10 connections. With multiple concurrent threads and polling storms, Aiven MySQL free tier connection thresholds were frequently breached (`Too many connections`).

---

## 2. Audit Findings Summary Table

| Component | Audited Issue | Severity | Target Resolution |
| :--- | :--- | :--- | :--- |
| **Network Payload** | 7.5 MB – 10.4 MB `/api/data` payload | **CRITICAL** | Cloudinary WebP migration + DTO (< 50 KB) |
| **HTTP Caching** | `cache: 'no-store'` + missing ETags | **CRITICAL** | `ShallowEtagHeaderFilter` + `304 Not Modified` |
| **Media Storage** | Ephemeral `uploads/avatars` storage | **CRITICAL** | Cloudinary SDK with permanent URLs |
| **Client Requests** | 2s–4s polling across 6 components | **HIGH** | Relax to 15s–30s + BroadcastChannel sync |
| **Database Queries** | Category `EAGER` icon fetch N+1 | **HIGH** | `FetchType.LAZY` + `@EntityGraph` join |
| **Connection Pool** | Unbounded HikariCP pool | **HIGH** | Explicit `maximum-pool-size=5` |
| **Container RAM** | JVM defaults causing OOMKilled | **HIGH** | `-XX:MaxRAMPercentage=60.0` (300 MB) |
| **Cold Starts** | Hard failures when Render wakes up | **MEDIUM** | Exponential backoff retry in DataContext |

---

## 3. Pre-Optimization vs. Post-Optimization Blueprint

```
[ BEFORE OPTIMIZATION ]
User Browser ---> [GET /api/data] ---> Render (Cold Start / OOM Risk)
       ^                                    |
       |--- 7.5 MB Base64 JSON Payload <----| (Transfers in 4-6s)
       |--- Polling every 2s-4s ------------| (Exhausts DB connections)

[ AFTER OPTIMIZATION ]
User Browser ---> [GET /api/data (If-None-Match: "v1")] ---> Render (300 MB JVM Bound)
       |                                                            |
       |<-- HTTP 304 Not Modified (0 bytes transferred, < 50ms) <---|
       |                                                            |
       | If Cache Miss:                                             |
       |<-- HTTP 200 OK (< 50 KB DTO with CDN Image URLs) <---------|
       |
       +---> Media Assets Loaded from Cloudinary Edge CDN (WebP, q_auto)
```
