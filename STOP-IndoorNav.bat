@echo off
title IndoorNav — Stop All
color 0C

echo.
echo  ╔══════════════════════════════════════╗
echo  ║    🛑  IndoorNav — Stopping All      ║
echo  ╚══════════════════════════════════════╝
echo.

echo  Killing Node.js processes (server + admin)...
taskkill /F /IM node.exe >nul 2>&1

echo  Killing Metro Bundler (Expo)...
taskkill /F /IM node.exe >nul 2>&1

echo  Closing IndoorNav terminal windows...
taskkill /F /FI "WINDOWTITLE eq IndoorNav — Server" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq IndoorNav — Admin" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq IndoorNav — Expo" >nul 2>&1

echo.
echo  ✅ All IndoorNav services stopped.
echo.
pause
