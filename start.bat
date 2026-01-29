@echo off
echo ================================================
echo GhostTalk Application - Quick Start
echo ================================================
echo.

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo ✓ Node.js is installed

echo.
echo [2/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed

echo.
echo [3/4] Checking environment variables...
if not exist .env.local (
    echo WARNING: .env.local file not found!
    echo Please create .env.local and configure:
    echo   - MONGODB_URI
    echo   - RESEND_API_KEY
    echo   - JWT_SECRET
    echo.
    pause
)

echo.
echo [4/4] Starting the application...
echo.
echo ================================================
echo Application starting on http://localhost:3000
echo Press Ctrl+C to stop the server
echo ================================================
echo.

call npm run dev
