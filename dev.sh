#!/bin/bash

echo "🚀 Starting GhostTalk Development Servers..."
echo ""

# Check if backend exists
if [ ! -d "backend" ]; then
  echo "❌ Backend directory not found!"
  exit 1
fi

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install
fi

if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  cd backend && npm install && cd ..
fi

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
  echo "⚠️  Backend .env not found! Copying from .env.example..."
  cp backend/.env.example backend/.env
  echo "⚠️  Please edit backend/.env with your MongoDB URI"
fi

if [ ! -f ".env.local" ]; then
  echo "⚠️  Frontend .env.local not found! Copying from .env.example..."
  cp .env.example .env.local
  echo "⚠️  Please edit .env.local with your credentials"
fi

echo ""
echo "✓ Setup complete!"
echo ""
echo "📡 Starting backend server on http://localhost:3001..."
echo "🌐 Starting frontend server on http://localhost:3000..."
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers
trap 'kill 0' EXIT
cd backend && npm start &
npm run dev
