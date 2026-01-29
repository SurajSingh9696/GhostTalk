@echo off
echo 🚀 Starting GhostTalk Development Servers...
echo.

REM Check if backend exists
if not exist "backend" (
  echo ❌ Backend directory not found!
  exit /b 1
)

REM Check if node_modules exist
if not exist "node_modules" (
  echo 📦 Installing frontend dependencies...
  call npm install
)

if not exist "backend\node_modules" (
  echo 📦 Installing backend dependencies...
  cd backend
  call npm install
  cd ..
)

REM Check if .env files exist
if not exist "backend\.env" (
  echo ⚠️ Backend .env not found! Copying from .env.example...
  copy backend\.env.example backend\.env
  echo ⚠️ Please edit backend\.env with your MongoDB URI
)

if not exist ".env.local" (
  echo ⚠️ Frontend .env.local not found! Copying from .env.example...
  copy .env.example .env.local
  echo ⚠️ Please edit .env.local with your credentials
)

echo.
echo ✓ Setup complete!
echo.
echo 📡 Backend: http://localhost:3001
echo 🌐 Frontend: http://localhost:3000
echo.
echo Starting servers in new windows...
echo Press Ctrl+C in each window to stop
echo.

REM Start backend in new window
start "GhostTalk Backend" cmd /k "cd backend && npm start"

REM Wait a bit for backend to start
timeout /t 2 /nobreak >nul

REM Start frontend
npm run dev
