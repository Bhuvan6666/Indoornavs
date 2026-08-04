@echo off
title IndoorNav — Start All Services
color 0A

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║       🏛️  IndoorNav — Master Launcher               ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

set ROOT_DIR=%~dp0

:: Check and install dependencies if needed
if not exist "%ROOT_DIR%server\node_modules" (
    echo  [Info] Installing Server dependencies...
    cd /d "%ROOT_DIR%server"
    call npm install
)

if not exist "%ROOT_DIR%admin\node_modules" (
    echo  [Info] Installing Admin Dashboard dependencies...
    cd /d "%ROOT_DIR%admin"
    call npm install
)

if not exist "%ROOT_DIR%node_modules" (
    echo  [Info] Installing Mobile App dependencies...
    cd /d "%ROOT_DIR%"
    call npm install
)

echo.
echo  [1/3] Starting Express Backend Server (Port 3001)...
start "IndoorNav — Server" cmd /k "cd /d "%ROOT_DIR%server" && npm start"

timeout /t 2 /nobreak >nul

echo  [2/3] Starting Admin Web Dashboard (Port 3000)...
start "IndoorNav — Admin" cmd /k "cd /d "%ROOT_DIR%admin" && set HOST=localhost&& set BROWSER=none&& npm start"

echo  Waiting for Admin Dashboard to compile...
timeout /t 8 /nobreak >nul

echo  Opening Admin Dashboard in your browser...
start "" "http://localhost:3000"

timeout /t 2 /nobreak >nul

echo  [3/3] Starting Mobile Navigation App (Expo Metro)...
start "IndoorNav — Expo Mobile" cmd /k "cd /d "%ROOT_DIR%" && npx expo start"

echo.
echo  ======================================================
echo  ✅ All IndoorNav services launched successfully!
echo  ======================================================
echo.
echo  📌 Admin Dashboard  →  http://localhost:3000 (Opened in Browser)
echo  📌 Backend Server   →  http://localhost:3001
echo  📌 Mobile App       →  Scan QR code in Expo Metro window
echo.
echo  Press any key to close this launcher window.
echo  (Services will keep running in their own windows).
echo.
pause >nul
