# ApexServices — Complete Performance Optimization Changelog

## 1. Overview of Changes

This changelog records all source files modified, created, and tested during the comprehensive performance optimization, cloud media migration, and reliability hardening of the ApexServices monorepo.

---

## 2. Backend Engine (Spring Boot 4.1.1 / Java 21)

### Dependencies & Build
- `Backend/pom.xml`:
  - Added `com.cloudinary:cloudinary-http44:1.38.0` dependency for cloud media storage and automatic WebP format transformation.
- `Backend/Dockerfile`:
  - Updated container entrypoint with JVM container memory controls: `-XX:+UseContainerSupport -XX:MaxRAMPercentage=60.0 -XX:InitialRAMPercentage=30.0 -XX:+ExitOnOutOfMemoryError` to prevent Render 512 MB OOM crashes.

### Configuration & Security
- `Backend/src/main/resources/application.properties`:
  - Configured explicit HikariCP connection pool parameters (`maximum-pool-size=5`, `minimum-idle=1`, `connection-timeout=20000`, `idle-timeout=300000`, `max-lifetime=1500000`).
  - Added Cloudinary configuration properties with safe environment variable fallbacks.
- `Backend/src/main/java/com/apexservices/config/CloudinaryConfig.java` *(NEW)*:
  - Spring `@Configuration` bean reading `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- `Backend/src/main/java/com/apexservices/config/EtagFilterConfig.java` *(NEW)*:
  - Registered `ShallowEtagHeaderFilter` Bean targeting `/api/data/*`, `/api/bootstrap/*`, `/api/catalog/*`, and `/api/settings/*`.

### Media Storage & Migration Architecture
- `Backend/src/main/java/com/apexservices/service/media/MediaStorageService.java` *(NEW)*:
  - Storage interface abstraction defining `uploadImage`, `uploadBase64Image`, `deleteImage`, and `isCloudStorageConfigured`.
- `Backend/src/main/java/com/apexservices/service/media/CloudinaryStorageService.java` *(NEW)*:
  - Primary production implementation with automatic WebP transformation (`q_auto,f_auto`), base64 decoding, folder namespacing, and graceful error handling.
- `Backend/src/main/java/com/apexservices/service/media/LocalFallbackMediaStorageService.java` *(NEW)*:
  - Safe local/mock implementation used when Cloudinary credentials are omitted.
- `Backend/src/main/java/com/apexservices/service/media/ImageMigrationService.java` *(NEW)*:
  - Idempotent migration engine that extracts Base64 images from `site_settings` and `work_requests`, uploads them to Cloudinary, creates timestamped rollback backups, and updates database records.
- `Backend/src/main/java/com/apexservices/controller/MediaMigrationController.java` *(NEW)*:
  - Admin endpoints for triggering migration (`POST /api/admin/media/migrate`), viewing history (`GET /api/admin/media/migration-history`), rolling back (`POST /api/admin/media/rollback`), and direct uploads (`POST /api/media/upload`).
- `Backend/src/main/java/com/apexservices/service/PartnerProfileService.java`:
  - Replaced ephemeral local disk saving in `uploads/avatars` with `mediaStorageService.uploadImage`. Dynamically propagates avatar URL to existing assigned work requests.

### API Response Optimization & DTOs
- `Backend/src/main/java/com/apexservices/dto/BootstrapDataResponseDto.java` *(NEW)*:
  - Strongly typed DTO representing the complete customer bootstrap payload (< 50 KB vs. legacy 7.5 MB).
- `Backend/src/main/java/com/apexservices/dto/CategoryPublicDto.java` *(NEW)*:
  - Clean category response DTO avoiding deep entity serialization.
- `Backend/src/main/java/com/apexservices/controller/ContentDataController.java`:
  - Added atomic `contentVersion` counter bumped on admin mutations.
  - Implemented `If-None-Match` conditional handling returning `HTTP 304 Not Modified` on unchanged requests.
  - Added modular endpoints `GET /api/bootstrap/config` and `GET /api/catalog/categories`.

### Database Optimization & Flyway
- `Backend/src/main/java/com/apexservices/model/Category.java`:
  - Changed `icon` relationship to `fetch = FetchType.LAZY` to prevent N+1 queries.
- `Backend/src/main/java/com/apexservices/repository/CategoryRepository.java`:
  - Added `@EntityGraph(attributePaths = {"icon"})` on `findAllByOrderByIdAsc()` and `findByActiveTrueOrderByIdAsc()` for single-query joins.
- `Backend/src/main/resources/db/migration/V11__add_performance_indexes.sql` *(NEW)*:
  - Added composite indexes:
    - `idx_wr_customer_created` on `work_requests(customer_id, created_at DESC)`
    - `idx_wr_partner_status_created` on `work_requests(assigned_partner_id, status, created_at DESC)`
    - `idx_partner_docs_type` on `partner_documents(partner_id, document_type)`

---

## 3. Frontend Applications (React 19 / Vite 8)

### Customer Portal (`Frontend/customer`)
- `src/context/DataContext.jsx`:
  - Removed `cache: 'no-store'`.
  - Added ETag tracking via `apex_etag` in `localStorage` and handled `304 Not Modified` responses.
  - Added exponential backoff retry logic (2s, 4s, 8s, max 3 retries) with cold-start status indicator.
  - Relaxed background sync poll from 10s to 60s (sync is instant via `BroadcastChannel` and `window.onfocus`).
- `src/views/RequestWorkPage.jsx`:
  - Relaxed tracking status poll from 3s to 15s.
  - Added client-side Canvas compression for customer damage photo uploads before saving.
- `test/DataContextOptimization.test.mjs` *(NEW)*:
  - Unit tests verifying ETag conditional fetching, 304 state reuse, backoff calculation, and payload reduction.

### Partner Portal (`Frontend/partner`)
- `src/context/PartnerContext.jsx`:
  - Relaxed live feed polling from 2s to 15s.
  - Added `isFeedPollingRef` in-flight guard preventing overlapping requests.
- `src/views/support/HelpSupportScreen.jsx`:
  - Relaxed ticket polling from 5s to 25s.

### Admin Portal (`Frontend/admin`)
- `src/components/RecentActivity.jsx`:
  - Relaxed activity feed polling from 3s to 20s.
- `src/components/PaymentTransactionsSection.jsx`:
  - Relaxed financials poll from 6s to 30s.
- `src/components/SupportTicketManagementSection.jsx`:
  - Relaxed ticket poll from 4s to 25s.
- `src/components/StatCards.jsx`:
  - Relaxed dashboard stats poll from 10s to 30s.
- `src/components/ContentControlSection.jsx` & `ServiceCategoriesSection.jsx`:
  - Added `compressAndUploadImage` utility executing client-side canvas resizing before uploading to cloud storage.

---

## 4. Automated Testing Suite

- `Backend/src/test/java/com/apexservices/service/media/CloudinaryStorageServiceTest.java` *(NEW)*: 6 tests passing.
- `Backend/src/test/java/com/apexservices/service/media/ImageMigrationServiceTest.java` *(NEW)*: 4 tests passing.
- `Backend/src/test/java/com/apexservices/service/PartnerProfileServiceAvatarTest.java` *(NEW)*: 2 tests passing.
- `Backend/src/test/java/com/apexservices/controller/ContentDataControllerOptimizationTest.java` *(NEW)*: 5 tests passing.
- `Frontend/customer/test/DataContextOptimization.test.mjs` *(NEW)*: 4 tests passing.
