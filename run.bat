@echo off
title Launching PassPhoto-Studio-AI-Passport-Maker
echo ========================================================
echo   [1-CLICK RUN] Starting PassPhoto-Studio-AI-Passport-Maker
echo ========================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js (v18+) from https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [INFO] Installing project dependencies (npm install)...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install encountered an error.
        pause
        exit /b 1
    )
)

echo [INFO] Opening application in your default web browser...
start http://localhost:3000

echo [INFO] Launching Next.js development server...
echo Press Ctrl+C in this terminal to stop the server at any time.
echo.
call npm run dev
pause
