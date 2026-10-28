@echo off
title ApexServices System Launcher
color 0A
cls
echo ===============================================================
echo                APEXSERVICES SYSTEM LAUNCHER
echo ===============================================================
echo.

set ROOT=%~dp0

:: 1. Verify MySQL connectivity on port 3306
echo [1/5] Checking MySQL Database status on port 3306...
powershell -NoProfile -Command "try { $c = New-Object System.Net.Sockets.TcpClient('127.0.0.1', 3306); $c.Close(); Write-Host '       [OK] MySQL Database is running on port 3306' -ForegroundColor Green } catch { Write-Host '       [WARNING] MySQL not detected on port 3306. Make sure MySQL service is running!' -ForegroundColor Yellow }"

:: 2. Launch Spring Boot Backend
echo.
echo [2/5] Starting Spring Boot Backend API (Port 8080)...
start "ApexServices Backend [8080]" cmd /k "cd /d "%ROOT%Backend" && echo === Spring Boot Backend [Port 8080] === && .\mvnw.cmd spring-boot:run"

:: Allow backend 4 seconds to initiate startup
timeout /t 4 /nobreak >nul

:: 3. Launch Customer Portal
echo.
echo [3/5] Starting Customer Portal (Port 5173)...
start "ApexServices Customer Portal [5173]" cmd /k "cd /d "%ROOT%Frontend\customer" && echo === Customer Portal [Port 5173] === && npm run dev"

:: 4. Launch Admin Portal
echo.
echo [4/5] Starting Admin Operations Portal (Port 5174)...
start "ApexServices Admin Portal [5174]" cmd /k "cd /d "%ROOT%Frontend\admin" && echo === Admin Portal [Port 5174] === && npm run dev"

:: 5. Launch Partner Portal
echo.
echo [5/5] Starting Partner Portal (Port 5175)...
start "ApexServices Partner Portal [5175]" cmd /k "cd /d "%ROOT%Frontend\partner" && echo === Partner Portal [Port 5175] === && npm run dev"

echo.
echo ===============================================================
echo            ALL APEXSERVICES SERVERS LAUNCHED!
echo ===============================================================
echo.
echo   Customer Portal : http://localhost:5173
echo   Admin Portal    : http://localhost:5174
echo   Partner Portal  : http://localhost:5175
echo   Backend API     : http://localhost:8080
echo   Health Actuator : http://localhost:8080/actuator/health
echo.
echo   To stop all running servers anytime, double-click:
echo   stop-all.bat
echo ===============================================================
echo.
echo Press any key to close this launcher window (services keep running)...
pause >nul
