# ApexServices — Cloudinary Migration Guide & Media Architecture

## 1. Overview

ApexServices has replaced raw Base64 database strings and ephemeral local disk uploads with a centralized, cloud-native media storage architecture powered by the Cloudinary Java SDK (`cloudinary-http44:1.38.0`).

All images are automatically served in next-generation WebP format with automated quality compression (`q_auto,f_auto`) and cached globally via Cloudinary's multi-CDN network.

---

## 2. Environment Variables Configuration

To activate production cloud media storage, set the following three environment variables in your Render backend service dashboard (or in `.env` for local testing):

```bash
# Cloudinary Production Credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### Safe Fallback Mechanism
If any of these three variables are missing or unconfigured:
- The backend logs a notice: `Cloudinary credentials not set in environment. Falling back to local/mock storage.`
- `LocalFallbackMediaStorageService` activates automatically, storing uploaded assets under `/api/public/media/` without crashing the application.
- All endpoints remain 100% operational in staging or offline local development environments.

---

## 3. Automated Migration Tooling

An idempotent, transactional migration engine has been built directly into the Spring Boot backend (`ImageMigrationService.java`).

### 3.1. Triggering Full Media Migration
An administrator can execute the migration via a secured HTTP POST request:

```http
POST /api/admin/media/migrate
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

**Response Format**:
```json
{
  "id": "mig_84a1e93c",
  "sourceTable": "site_settings, work_requests",
  "sourceKey": "all",
  "status": "COMPLETED",
  "itemsMigrated": 9,
  "itemsFailed": 0,
  "details": "Migration finished with 9 assets migrated and 0 failures.",
  "timestamp": "2026-11-04T21:40:00.000Z"
}
```

### 3.2. Idempotency & Safety Guarantees
1. **Detection**: The service inspects values in `site_settings` (`siteBranding`, `categoryImages`, `logoImageUrl`) and `work_requests` (`photoUrl`). Only strings starting with `data:image/` are processed. Existing HTTP/HTTPS URLs are skipped untouched.
2. **Pre-Mutation Rollback Backup**: Before writing any new URL to `site_settings`, the service saves the complete, unmutated JSON payload under a timestamped key:
   `siteBranding_backup_<currentTimeMillis>`
3. **Audit Trail**: Every migration execution is recorded in memory and accessible via `GET /api/admin/media/migration-history`.

---

## 4. Rollback Protocol

If an administrator wishes to revert a migration for any reason, the rollback endpoint restores the previous database state instantly:

```http
POST /api/admin/media/rollback?targetKey=siteBranding&backupKey=siteBranding_backup_1793808733071
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

**Response**:
```json
{
  "success": true,
  "message": "Setting siteBranding restored from backup siteBranding_backup_1793808733071"
}
```

---

## 5. Direct Media Upload API

Frontend applications (Admin portal and Partner portal) can upload new images directly through the centralized media controller:

```http
POST /api/media/upload?folder=categories
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

file: <binary_image_data>
```

**Response**:
```json
{
  "url": "https://res.cloudinary.com/<cloud_name>/image/upload/q_auto,f_auto/categories/cat_5.webp"
}
```

---

## 6. Client-Side Pre-Upload Canvas Compression

To minimize bandwidth and upload times from mobile or high-resolution devices, both `ContentControlSection.jsx` and `ServiceCategoriesSection.jsx` include client-side HTML5 Canvas resizing:

```javascript
// Pre-upload optimization in Admin & Customer frontends
const compressImage = (file, maxWidth = 1000, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob), 'image/webp', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};
```
- **Result**: High-resolution camera photos (often 5 MB – 12 MB) are compressed client-side to **< 150 KB** before network transmission.
