# GhostTalk - Quick Start Guide

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR USERS                           │
│                    (Browsers)                           │
└──────────────┬──────────────────────────┬───────────────┘
               │                          │
               │ HTTPS                    │ WebSocket (wss://)
               │                          │
               ▼                          ▼
┌──────────────────────────┐   ┌─────────────────────────┐
│   FRONTEND (Vercel)      │   │   BACKEND (Render)      │
│   ────────────────       │   │   ──────────────        │
│   • Next.js App          │   │   • Socket.IO Server    │
│   • React UI             │◄──┤   • Real-time Logic     │
│   • API Routes           │   │   • Message Handling    │
│   • Authentication       │   │                         │
└──────────────┬───────────┘   └───────────┬─────────────┘
               │                           │
               │ MongoDB                   │ MongoDB
               │ Connection                │ Connection
               ▼                           ▼
        ┌────────────────────────────────────┐
        │     MongoDB Atlas (Cloud DB)       │
        │     ─────────────────────          │
        │     • Users                        │
        │     • Rooms                        │
        │     • Messages                     │
        │     • Media                        │
        └────────────────────────────────────┘
```

## 🚀 Deployment Strategy

### Phase 1: Backend First
```bash
1. Deploy to Render
   ├── Root Directory: backend/
   ├── Port: 3001
   └── Get URL: https://backend.onrender.com
```

### Phase 2: Frontend Second
```bash
2. Deploy to Vercel
   ├── Root Directory: (root)
   ├── Set NEXT_PUBLIC_SOCKET_URL: https://backend.onrender.com
   └── Get URL: https://app.vercel.app
```

### Phase 3: Update Backend CORS
```bash
3. Update Backend
   └── Set FRONTEND_URL: https://app.vercel.app
```

## 💻 Local Development

### Option A: One-Command Start (Easiest)

**Windows:**
```cmd
dev.bat
```

**Mac/Linux:**
```bash
chmod +x dev.sh && ./dev.sh
```

### Option B: Manual Start

**Terminal 1:**
```bash
cd backend
npm install
npm start      # Runs on :3001
```

**Terminal 2:**
```bash
npm install
npm run dev    # Runs on :3000
```

## 📝 Environment Setup

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ghosttalk
FRONTEND_URL=http://localhost:3000
PORT=3001
```

### Frontend (.env.local)
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ghosttalk
JWT_SECRET=your-secret-key-32-chars-minimum
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## ✅ Quick Verification

### 1. Backend Running?
```bash
curl http://localhost:3001/health
# ✓ {"status":"ok","timestamp":"..."}
```

### 2. Frontend Running?
```
Open: http://localhost:3000
Check console: "Socket connected: [id]"
```

### 3. Database Connected?
```
Sign up → Creates user in MongoDB
```

### 4. Real-time Works?
```
Open 2 browser windows → Send message → Appears instantly
```

## 🎯 Production URLs

After deployment, update these:

**Backend Render:**
```
URL: https://your-backend.onrender.com
Health: https://your-backend.onrender.com/health
```

**Frontend Vercel:**
```
URL: https://your-app.vercel.app
Admin: https://vercel.com/dashboard
```

## 🔄 Update Flow

### When you make changes:

**Backend Changes:**
```bash
git add backend/
git commit -m "Update backend"
git push
# Render auto-deploys
```

**Frontend Changes:**
```bash
git add app/ lib/ public/
git commit -m "Update frontend"
git push
# Vercel auto-deploys
```

## 🐛 Quick Troubleshooting

| Problem | Check | Fix |
|---------|-------|-----|
| Can't connect to backend | `curl backend-url/health` | Verify NEXT_PUBLIC_SOCKET_URL |
| Messages not sending | Browser console | Check Socket.IO connection |
| CORS error | Backend logs | Update FRONTEND_URL |
| Build fails | Vercel logs | Check environment variables |
| Backend crash | Render logs | Check MongoDB URI |

## 📦 What's Included

```
GhostTalk/
├── app/              → Next.js frontend
├── backend/          → Socket.IO server
│   ├── server.js     → Main backend file
│   ├── models/       → MongoDB schemas
│   └── package.json  → Backend dependencies
├── lib/              → Shared utilities
├── public/           → Static files
├── dev.bat           → Windows dev script
├── dev.sh            → Unix dev script
├── CHECKLIST.md      → Deployment checklist
├── DEPLOYMENT.md     → Full deployment guide
├── ARCHITECTURE.md   → Architecture details
└── README.md         → Main documentation
```

## 🎓 Learn More

- **Full Deployment Guide**: [CHECKLIST.md](CHECKLIST.md)
- **Architecture Details**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Backend Docs**: [backend/README.md](backend/README.md)
- **Troubleshooting**: [DEPLOYMENT.md](DEPLOYMENT.md)

## 🎉 You're Ready!

Your app is now structured for production deployment with:
- ✅ Separated frontend and backend
- ✅ Real-time WebSocket support
- ✅ HTTP fallback for reliability
- ✅ Easy local development
- ✅ Scalable architecture

**Next Steps:**
1. Set up MongoDB Atlas
2. Get Resend API key
3. Follow [CHECKLIST.md](CHECKLIST.md)
4. Deploy and enjoy! 🚀
