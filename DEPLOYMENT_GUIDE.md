# ApexServices — Production Deployment & Rollout Guide

## 1. Prerequisites & Infrastructure Setup
The ApexServices platform utilizes a unified backend architecture with multi-client deployment:
- **Authoritative Database**: Aiven MySQL 8.4
- **Backend Application Server**: Render (Java 21 / Spring Boot 3)
- **Frontend Applications**: Netlify (Customer Portal, Partner Portal, Admin Panel)

---

## 2. Environment Variables Configuration

### Backend (`Backend/.env` / Render Dashboard)
```env
SPRING_DATASOURCE_URL=jdbc:mysql://mysql-36d7d04b-anuragvj2312-edc3.a.aivencloud.com:17959/defaultdb?sslMode=REQUIRED&trustServerCertificate=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=avnadmin
SPRING_DATASOURCE_PASSWORD=*****
JWT_SECRET=*****
SPRING_FLYWAY_ENABLED=true
SPRING_FLYWAY_BASELINE_ON_MIGRATE=true
```

### Customer Frontend (`Frontend/customer/.env.production` / Netlify)
```env
NEXT_PUBLIC_API_URL=https://apexservices-backend.onrender.com/api
NEXT_PUBLIC_WS_URL=https://apexservices-backend.onrender.com/ws-dispatch
```

### Partner Frontend (`Frontend/partner/.env.production` / Netlify)
```env
NEXT_PUBLIC_API_URL=https://apexservices-backend.onrender.com/api
NEXT_PUBLIC_WS_URL=https://apexservices-backend.onrender.com/ws-dispatch
```

### Admin Frontend (`Frontend/admin/.env.production` / Netlify)
```env
VITE_API_URL=https://apexservices-backend.onrender.com/api
VITE_WS_URL=https://apexservices-backend.onrender.com/ws-dispatch
```

---

## 3. Step-by-Step Deployment Procedure

### Step 1: Deploy Backend to Render
1. Commit all changes to the main repository branch:
   ```bash
   git add .
   git commit -m "feat: complete admin panel ecosystem integration, database normalization and security hardening"
   git push origin main
   ```
2. Render detects the push and executes `./mvnw clean package -DskipTests`.
3. Upon startup, Flyway automatically validates existing migrations and applies any pending migrations (`V10__normalize_admin_ecosystem_entities.sql`).

### Step 2: Deploy Frontends to Netlify
Netlify automatically triggers builds for each connected site:
- **Admin Portal**: Builds via `npm run build` (`dist/` output).
- **Customer Portal**: Builds via Next.js Turbopack (`.next/` output).
- **Partner Portal**: Builds via Next.js Turbopack (`.next/` output).

---

## 4. Post-Deployment Verification Checklist
1. **Admin Panel Access**:
   - Navigate to `https://apexservices-admin-portal.netlify.app`.
   - Log in with administrative credentials. Verify that no hardcoded credentials remain.
   - Confirm that the sidebar displays all 16 core modules with zero standalone `Notifications` clutter.
2. **Support & Disputes**:
   - Submit a dispute from the Customer portal.
   - Verify that it immediately populates under Admin Support Desk.
3. **KYC Verification**:
   - Partner uploads a document in Partner Documents screen.
   - Verify that it renders under Admin Partner Management and can be reviewed with a status update.
4. **Coupons Engine**:
   - Create a coupon in Admin Coupons module.
   - Apply the coupon on the Customer work request page; verify that the discount recalculates accurately from the backend.
5. **Session Governance**:
   - Terminate an active session under Admin Sessions module.
   - Verify that the target user's next authenticated API call returns `401 Unauthorized`.
