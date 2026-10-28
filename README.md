# ApexServices — Complete Full-Stack Platform

Enterprise multi-tier on-demand home services platform with dedicated customer portal, administrative control center, and Spring Boot REST API backend.

---

## 📁 Repository Directory Structure

```text
ApexServices/
├── Frontend/                          # All Frontend Applications & Portals
│   │
│   ├── customer/                      # Customer-Facing Portal (ApexServices)
│   │   ├── src/                       # Work request wizard, diagnostic price quotes, tracking
│   │   ├── package.json               # Running on http://localhost:5173
│   │   └── vite.config.js
│   │
│   ├── admin/                         # Enterprise Admin Panel (ApexServices Admin)
│   │   ├── src/                       # Service operations, financial ledger, system settings
│   │   ├── package.json               # Running on http://localhost:5174
│   │   └── vite.config.js
│   │
│   └── package.json                   # Root Frontend Workspace scripts
│
└── Backend/                           # Spring Boot Multi-tier REST API Service
    ├── src/main/java/com/example/demo/
    │   ├── controller/ApiController.java
    │   ├── model/                     # JPA Entities (ServicePartner, PartnerPayout, etc.)
    │   └── repository/                # Data Repositories
    ├── pom.xml                        # Maven dependencies & build configuration
    ├── mvnw / mvnw.cmd                # Maven Wrapper
    └── src/main/resources/application.properties
```

---

## 🚀 1-Click Startup (All Services)

To launch the backend and all three frontend portals with a single command:

### Option A: Windows Batch (Double-Clickable)
Double-click [`start-all.bat`](file:///C:/Users/HARISHANKAR/Desktop/ApexServices/start-all.bat) or run from CMD:
```cmd
start-all.bat
```

### Option B: PowerShell
```powershell
.\start-all.ps1
```

To stop all servers and release all ports:
```cmd
stop-all.bat
```

---

## 🌐 Running Services & URLs

| Service | Directory | URL | Tech Stack |
| :--- | :--- | :--- | :--- |
| **Backend API** | `Backend` | [http://localhost:8080](http://localhost:8080) | Spring Boot 3, Java 21+, MySQL |
| **Customer Portal** | `Frontend/customer` | [http://localhost:5173](http://localhost:5173) | React 19, Vite, Tailwind CSS |
| **Admin Operations** | `Frontend/admin` | [http://localhost:5174](http://localhost:5174) | React 19, Vite, Tailwind CSS |
| **Partner Portal** | `Frontend/partner` | [http://localhost:5175](http://localhost:5175) | React 19, Vite, Tailwind CSS |
| **Health Check** | `Backend` | [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health) | Spring Actuator |

---

## 🚀 Manual Startup (Service by Service)
* **Command**:
  ```powershell
  cd ApexServices\Frontend\customer
  npm run dev
  ```
  *URL: http://localhost:5173/*

### 3. Admin Panel
* **Path**: `ApexServices/Frontend/admin`
* **Port**: `5174`
* **Command**:
  ```powershell
  cd ApexServices\Frontend\admin
  npm run dev
  ```
  *URL: http://localhost:5174/*
