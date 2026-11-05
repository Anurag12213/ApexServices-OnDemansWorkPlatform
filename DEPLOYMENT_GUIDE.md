# ApexServices — Production Deployment & Rollout Guide

## 1. Prerequisites & Infrastructure Setup

The ApexServices platform utilizes a unified backend architecture with multi-client deployment:
- **Authoritative Database**: Aiven MySQL 8.0 / 8.4
- **Backend Application Server**: Dockerized Spring Boot 4.1.1 on Render (Free Tier, 512 MB RAM)
- **Cloud Media Storage**: Cloudinary Media Delivery Network
- **Frontend Applications**: Netlify (Customer Portal, Partner Portal, Admin Panel)

---

## 2. Environment Variables Configuration

### 2.1. Backend (`Backend/.env` / Render Dashboard)

Configure the following environment variables in the Render backend service settings:

```env
# Database Configuration (Aiven MySQL)
SPRING_DATASOURCE_URL=jdbc:mysql://<your-aiven-mysql-host>:<port>/defaultdb?sslMode=REQUIRED&trustServerCertificate=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=<your-database-username>
SPRING_DATASOURCE_PASSWORD=*****

# Flyway Migrations
SPRING_FLYWAY_ENABLED=true
SPRING_FLYWAY_BASELINE_ON_MIGRATE=true

# Security & JWT
JWT_SECRET=*****

# Cloudinary Media Storage (CRITICAL FOR PERFORMANCE)
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

> **Note**: If Cloudinary credentials are omitted during initial startup, the backend automatically activates `LocalFallbackMediaStorageService` without failing.

### 2.2. Customer Frontend (`Frontend/customer` / Netlify)
```env
NEXT_PUBLIC_API_URL=https://apexservices-backend.onrender.com/api
NEXT_PUBLIC_WS_URL=https://apexservices-backend.onrender.com/ws-dispatch
```

### 2.3. Partner Frontend (`Frontend/partner` / Netlify)
```env
NEXT_PUBLIC_API_URL=https://apexservices-backend.onrender.com/api
NEXT_PUBLIC_WS_URL=https://apexservices-backend.onrender.com/ws-dispatch
```

### 2.4. Admin Frontend (`Frontend/admin` / Netlify)
```env
VITE_API_URL=https://apexservices-backend.onrender.com/api
VITE_WS_URL=https://apexservices-backend.onrender.com/ws-dispatch
```

---

## 3. Step-by-Step Deployment Procedure

### Step 1: Deploy Backend to Render
1. Verify Dockerfile JVM container memory options:
   `-XX:+UseContainerSupport -XX:MaxRAMPercentage=60.0 -XX:InitialRAMPercentage=30.0 -XX:+ExitOnOutOfMemoryError`
2. Push your changes to the deployment branch:
   ```bash
   git push origin main
   ```
3. Render automatically triggers the Docker multi-stage build:
   - Builds jar via `./mvnw clean package -DskipTests`.
   - Copies jar to Eclipse Temurin JRE 21 image.
4. Upon startup, Flyway automatically validates existing migrations and applies:
   - `V11__add_performance_indexes.sql` (adds composite performance indexes on `work_requests` and `partner_documents`).

### Step 2: Execute Media Migration (One-Time)
Once the backend is healthy on Render:
1. Log in to the Admin Panel as an administrator.
2. Obtain your JWT Bearer token and trigger the idempotent media migration:
   ```bash
   curl -X POST https://apexservices-backend.onrender.com/api/admin/media/migrate \
     -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
   ```
3. The migration service will:
   - Create a backup of `siteBranding` in `site_settings`.
   - Convert all existing Base64 category and logo images to WebP URLs on Cloudinary.
   - Update `site_settings` in MySQL.

### Step 3: Deploy Frontends to Netlify
1. Netlify automatically triggers builds for connected sites:
   - **Admin Portal**: Builds via `npm run build` (`dist/` directory).
   - **Customer Portal**: Builds via `npm run build:vite` or Next.js static export.
   - **Partner Portal**: Builds via `npm run build:vite` or Next.js static export.

---

## 4. Post-Deployment Verification Checklist

1. **Verify `/api/data` ETag & Size Reduction**:
   - Open Chrome DevTools Network Tab on the customer website.
   - First load: `GET /api/data` -> Status `200 OK`, Transfer Size `< 45 KB`.
   - Reload (F5): `GET /api/data` -> Status `304 Not Modified`, Transfer Size `0 Bytes` (served from cache in `< 50ms`).
2. **Verify Cold-Start Resilience**:
   - Wait 15 minutes for Render to sleep.
   - Reopen the customer website.
   - Confirm that the UI loads cached categories and branding **instantly (< 10ms)** from `localStorage`, showing a subtle connecting indicator while Render spins up.
3. **Verify Partner Avatars**:
   - Have a partner upload a profile photo.
   - Restart the Render backend service.
   - Confirm that the partner avatar still loads flawlessly from Cloudinary (ephemeral disk data loss eliminated).
4. **Verify Database Connections**:
   - Check `GET /actuator/health`.
   - Confirm HikariCP active connections stay at `0–2` under regular load.
