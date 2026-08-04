@echo off
title IndoorNav — Launcher
color 0A

echo.
echo  ╔══════════════════════════════════════╗
echo  ║     🗺️  IndoorNav — Starting All     ║
echo  ╚══════════════════════════════════════╝
echo.

echo  [1/3] Starting Backend Server (port 3001)...
start "IndoorNav — Server" cmd /k "cd /d "%~dp0server" && npm start"

timeout /t 2 /nobreak >nul

echo  [2/3] Starting Admin Dashboard (port 3000)...
start "IndoorNav — Admin" cmd /k "cd /d "%~dp0admin" && set HOST=localhost&& set BROWSER=none&& npm start"

echo  Waiting for Admin to compile (this takes ~8 seconds)...
timeout /t 10 /nobreak >nul

echo  Opening Admin Dashboard in your browser...
start "" "http://localhost:3000"

timeout /t 2 /nobreak >nul

echo  [3/3] Starting Mobile App (Expo)...
start "IndoorNav — Expo" cmd /k "cd /d "%~dp0" && npx expo start"

echo.
echo  ✅ All three services launched!
echo.
echo  📌 Admin Dashboard  →  http://localhost:3000  (opened in browser)
echo  📌 Backend Server   →  http://localhost:3001
echo  📌 Mobile App       →  Scan QR in the Expo window
echo.
echo  Run STOP-IndoorNav.bat to kill everything at once.
echo.
pause
