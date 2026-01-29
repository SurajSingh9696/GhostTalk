# GhostTalk - Separated Architecture Migration

## ✅ What Changed

Your GhostTalk app has been successfully separated into two independent services:

### Before (Monolithic)
```
Single Next.js App (server.js)
├── Next.js Frontend
├── Socket.IO Server
└── MongoDB Connection
```
**Problem:** Couldn't deploy to Vercel (no WebSocket support)

### After (Microservices)
```
Frontend (Next.js)          Backend (Socket.IO)
├── Next.js App      ←────→ ├── Socket.IO Server
├── API Routes              ├── MongoDB Connection
└── UI Components           └── Real-time Logic
```
**Solution:** Deploy frontend to Vercel + backend to Render!

## 📂 New Structure

```
GhostTalk/
├── app/                    # Next.js frontend (deploy to Vercel)
├── lib/                    # Shared utilities
├── public/                 # Static assets
├── backend/                # Socket.IO backend (deploy to Render)
│   ├── server.js          # Standalone Socket.IO server
│   ├── models/            # MongoDB models
│   ├── package.json       # Backend dependencies
│   └── README.md          # Backend documentation
├── dev.bat                # Windows development script
├── dev.sh                 # Mac/Linux development script
├── DEPLOYMENT.md          # Updated deployment guide
└── README.md              # Updated main documentation
```

## 🚀 Deployment Guide

### Step 1: Deploy Backend (Render)

1. **Create Web Service on Render**
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Environment Variables**
   ```env
   MONGODB_URI=your_mongodb_uri
   FRONTEND_URL=https://will-add-after-frontend-deploy
   PORT=3001
   ```

3. **Copy Backend URL** (e.g., `https://ghosttalk-backend.onrender.com`)

### Step 2: Deploy Frontend (Vercel)

1. **Import to Vercel**
   - Auto-detects Next.js
   - No root directory needed

2. **Environment Variables**
   ```env
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_secret_key
   RESEND_API_KEY=your_resend_key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   NEXT_PUBLIC_SOCKET_URL=https://ghosttalk-backend.onrender.com
   ```

3. **Deploy** and copy frontend URL

### Step 3: Update Backend CORS

1. Go back to Render
2. Update `FRONTEND_URL` to your Vercel URL
3. Redeploy backend

## 💻 Local Development

### Option 1: Quick Start (Recommended)

**Windows:**
```bash
dev.bat
```

**Mac/Linux:**
```bash
chmod +x dev.sh
./dev.sh
```

This starts both servers automatically!

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env
npm start
```

**Terminal 2 - Frontend:**
```bash
npm install
cp .env.example .env.local
# Edit .env.local
npm run dev
```

## ✨ What You Get

### ✅ Better Deployment Options
- Frontend on Vercel (fast, free CDN)
- Backend on Render (WebSocket support)
- Can scale each service independently

### ✅ Real-Time Features Work
- WebSocket connection to backend
- Instant messaging
- Typing indicators
- Live participant updates

### ✅ HTTP Fallback Still Works
- If WebSocket fails, automatically uses HTTP API
- All features functional (except typing indicators)
- No configuration needed

### ✅ Easier Development
- Run both services with one command
- Clear separation of concerns
- Independent testing

## 🔧 Configuration

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=http://localhost:3000  # or production URL
PORT=3001
```

### Frontend (.env.local)
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001  # or production URL
```

## 🎯 Key Changes

### 1. Package.json
**Before:**
```json
"scripts": {
  "dev": "node server.js",
  "start": "NODE_ENV=production node server.js"
}
```

**After:**
```json
"scripts": {
  "dev": "next dev",
  "start": "next start"
}
```

### 2. Socket.IO Connection
Frontend now connects to external backend:
```javascript
// Before
const socket = io('http://localhost:3000')

// After
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL)
```

### 3. Backend is Standalone
- Runs independently on its own port
- Has its own package.json
- Includes necessary models
- Configured CORS for frontend

## 📊 Performance

### Separated Architecture Benefits:

| Aspect | Before | After |
|--------|--------|-------|
| Deploy to Vercel | ❌ No | ✅ Yes |
| WebSocket Support | ⚠️ Custom Server Only | ✅ Always |
| CDN for Static Assets | ❌ No | ✅ Yes (Vercel) |
| Scale Frontend | ⚠️ Both together | ✅ Independent |
| Scale Backend | ⚠️ Both together | ✅ Independent |
| Cold Start Time | Slow (both) | Fast (each) |

## 🧪 Testing Your Setup

### 1. Test Backend
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 2. Test Frontend
- Visit http://localhost:3000
- Check browser console for "Socket connected: [id]"
- Create account → Create room → Send messages

### 3. Test Real-Time
- Open room in two browser windows
- Send message from one
- Should appear instantly in other

## 🚨 Troubleshooting

### Backend Won't Start
```bash
# Check environment variables
cat backend/.env

# Check MongoDB connection
# Make sure MONGODB_URI is correct

# Check port availability
netstat -an | grep 3001
```

### Frontend Can't Connect to Backend
```bash
# Verify backend is running
curl http://localhost:3001/health

# Check NEXT_PUBLIC_SOCKET_URL in .env.local
# Must be http://localhost:3001 for local dev

# Check browser console for connection errors
```

### CORS Errors
```bash
# Make sure backend FRONTEND_URL matches frontend URL
# For local: http://localhost:3000
# For production: https://your-app.vercel.app
```

## 📝 Migration Checklist

- [x] Backend service created in `/backend`
- [x] Backend has own package.json
- [x] Models copied to backend
- [x] Standalone server.js created
- [x] CORS configured
- [x] Frontend package.json updated
- [x] Development scripts created (dev.bat/dev.sh)
- [x] Documentation updated
- [x] .env.example files created
- [x] Deployment guide updated

## 🎉 Benefits Summary

1. **Deploy Anywhere**
   - Frontend → Vercel, Netlify, Cloudflare Pages
   - Backend → Render, Railway, Heroku, VPS

2. **Better Performance**
   - Frontend on CDN (Vercel)
   - Backend dedicated to WebSockets
   - Faster load times

3. **Easier Scaling**
   - Scale frontend and backend independently
   - Pay only for what you need

4. **Cleaner Code**
   - Clear separation of concerns
   - Easier to maintain and debug

5. **More Options**
   - Can add more backend servers
   - Can add load balancing
   - Can add Redis for multi-instance support

## 📚 Next Steps

1. **Deploy to Production**
   - Follow DEPLOYMENT.md step by step
   - Test thoroughly before sharing

2. **Optional Enhancements**
   - Add Redis for horizontal scaling
   - Add health monitoring
   - Add rate limiting
   - Add analytics

3. **Monitor Your Apps**
   - Render provides logs and metrics
   - Vercel provides analytics
   - Set up error tracking (Sentry)

## 🆘 Getting Help

- Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment steps
- Check [backend/README.md](backend/README.md) for backend-specific docs
- Check environment variables are correctly set
- Test locally before deploying to production

---

**Your app is now ready to deploy to production with separated architecture! 🚀**

Both HTTP fallback (existing) and real-time WebSocket (new backend) work seamlessly together.
