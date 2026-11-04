@echo off
cd /d "%~dp0"
title ARENIUM 27 CORE - Unified System Launcher
color 0B

echo =====================================================================
echo                ARENIUM 27 CORE - UNIFIED LAUNCHER
echo      Client-Admin-Server - QR Attendance - Hourly OD Approvals
echo =====================================================================
echo.

:: 1. Check Node.js
echo [1/4] Checking Node.js runtime...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your PATH!
    echo Please install Node.js from https://nodejs.org/ and restart this launcher.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [OK] Node.js %NODE_VER% detected.
echo.

:: 2. Free ports 5000 and 5173 if previously occupied
echo [2/4] Checking ports 5000 and 5173...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5000,5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force -ErrorAction SilentlyContinue" >nul 2>nul
echo [OK] Ports 5000 and 5173 verified.
echo.

:: 3. Check dependencies
echo [3/4] Verifying packages...
if not exist "node_modules\" (
    echo [*] Installing root packages...
    call npm install
)
if not exist "server\node_modules\" (
    echo [*] Installing server packages...
    pushd server
    call npm install
    popd
)
if not exist "client\node_modules\" (
    echo [*] Installing client packages...
    pushd client
    call npm install
    popd
)
echo [OK] All dependencies ready.
echo.

:: 4. Launch fullstack app and open browser
echo [4/4] Starting Server and Client (PC, Phones and Tablets)...
echo       - PC Local:       http://localhost:5173
echo       - Phone and Tablet: http://192.168.193.183:5173
echo.
echo Launching your browser in 2 seconds...
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:5173'"

echo =====================================================================
echo System is running. Press Ctrl+C in this window to stop both.
echo =====================================================================
echo.

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [NOTICE] Process ended with exit code %errorlevel%.
)

pause
