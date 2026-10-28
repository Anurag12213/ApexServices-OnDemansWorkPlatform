# ===============================================================
# ApexServices Complete Project Launcher (PowerShell)
# ===============================================================

$ErrorActionPreference = "Continue"
$Root = $PSScriptRoot

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "                APEXSERVICES SYSTEM LAUNCHER                   " -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check MySQL
Write-Host "[1/5] Checking MySQL Database connectivity (Port 3306)..." -ForegroundColor Yellow
try {
    $tcp = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 3306)
    $tcp.Close()
    Write-Host "       [OK] MySQL is active and listening on port 3306" -ForegroundColor Green
} catch {
    Write-Host "       [WARNING] Could not connect to MySQL on port 3306." -ForegroundColor Red
    Write-Host "       Please ensure your MySQL service or XAMPP/WAMP is running!" -ForegroundColor Red
}

Write-Host ""

# 2. Launch Spring Boot Backend
Write-Host "[2/5] Starting Spring Boot Backend API (Port 8080)..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$Root\Backend`" && title ApexServices Backend [8080] && .\mvnw.cmd spring-boot:run"

Start-Sleep -Seconds 4

# 3. Launch Customer Portal
Write-Host "[3/5] Starting Customer Portal (Port 5173)..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$Root\Frontend\customer`" && title Customer Portal [5173] && npm run dev"

# 4. Launch Admin Portal
Write-Host "[4/5] Starting Admin Operations Portal (Port 5174)..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$Root\Frontend\admin`" && title Admin Portal [5174] && npm run dev"

# 5. Launch Partner Portal
Write-Host "[5/5] Starting Partner Portal (Port 5175)..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$Root\Frontend\partner`" && title Partner Portal [5175] && npm run dev"

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Green
Write-Host "            ALL APEXSERVICES SERVICES LAUNCHED!                " -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Customer Portal : http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Admin Portal    : http://localhost:5174" -ForegroundColor Cyan
Write-Host "  Partner Portal  : http://localhost:5175" -ForegroundColor Cyan
Write-Host "  Backend API     : http://localhost:8080" -ForegroundColor Cyan
Write-Host "  Health Actuator : http://localhost:8080/actuator/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "  To stop all servers, run: .\stop-all.bat or .\stop-all.ps1" -ForegroundColor Gray
Write-Host "===============================================================" -ForegroundColor Green
Write-Host ""
