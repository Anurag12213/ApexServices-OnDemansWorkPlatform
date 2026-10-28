@echo off
title Stop All ApexServices
color 0C
cls
echo ===============================================================
echo                STOPPING ALL APEXSERVICES
echo ===============================================================
echo.
echo Stopping services on ports 8080, 5173, 5174, 5175, 5176...
echo.

for %%P in (8080 5173 5174 5175 5176) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%%P ^| findstr LISTENING') do (
        echo Killing process PID %%a listening on port %%P...
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo.
echo ===============================================================
echo   All ApexServices ports have been released and stopped!
echo ===============================================================
echo.
pause
