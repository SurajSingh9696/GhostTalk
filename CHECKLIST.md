# 🚀 GhostTalk Deployment Checklist

Follow this checklist to deploy your separated architecture app successfully.

## ✅ Pre-Deployment Setup

### 1. MongoDB Atlas
- [ ] Create MongoDB Atlas account (if not already)
- [ ] Create a cluster
- [ ] Create database user
- [ ] Whitelist IP addresses (0.0.0.0/0 for cloud platforms)
- [ ] Copy connection string

### 2. Resend Email Service
- [ ] Sign up at https://resend.com
- [ ] Verify your domain OR use `onboarding@resend.dev` for testing
- [ ] Generate API key
- [ ] Copy API key

### 3. GitHub Repository
- [ ] Commit all changes
- [ ] Push to GitHub
- [ ] Verify backend/ directory is included

## 🔧 Backend Deployment (Render)

### Step 1: Create Service
- [ ] Go to https://dashboard.render.com
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Select your GhostTalk repository

### Step 2: Configure Service
- [ ] Name: `ghosttalk-backend` (or your choice)
- [ ] Region: Select closest to your users
- [ ] Branch: `main`
- [ ] **Root Directory: `backend`** ⚠️ IMPORTANT!
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Instance Type: Free (or paid for better performance)

### Step 3: Environment Variables
Add these in Render dashboard:

- [ ] `MONGODB_URI` = `your_mongodb_connection_string`
- [ ] `FRONTEND_URL` = `https://will-update-later` (placeholder for now)
- [ ] `PORT` = `3001`

### Step 4: Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for deployment to complete (check logs)
- [ ] **Copy backend URL**: `https://your-backend.onrender.com`
- [ ] Test health endpoint: `curl https://your-backend.onrender.com/health`
- [ ] Should return: `{"status":"ok","timestamp":"..."}`

## 🎨 Frontend Deployment (Vercel)

### Step 1: Import Project
- [ ] Go to https://vercel.com
- [ ] Click "Add New" → "Project"
- [ ] Import your GitHub repository
- [ ] Vercel auto-detects Next.js

### Step 2: Configure Project
- [ ] Leave Root Directory empty (uses repository root)
- [ ] Build Command: Auto-detected
- [ ] Output Directory: Auto-detected

### Step 3: Environment Variables
Add these in Vercel dashboard:

- [ ] `MONGODB_URI` = `your_mongodb_connection_string`
- [ ] `JWT_SECRET` = `generate_random_32_char_string`
- [ ] `RESEND_API_KEY` = `re_your_api_key`
- [ ] `NEXT_PUBLIC_APP_URL` = `https://will-update-after-deploy`
- [ ] `NEXT_PUBLIC_SOCKET_URL` = `https://your-backend.onrender.com` (from Step 4 above)

### Step 4: Deploy
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] **Copy frontend URL**: `https://your-app.vercel.app`
- [ ] Visit the URL to test

## 🔄 Final Configuration

### Update Backend CORS
- [ ] Go back to Render dashboard
- [ ] Select your backend service
- [ ] Go to Environment
- [ ] Update `FRONTEND_URL` to your Vercel URL: `https://your-app.vercel.app`
- [ ] Trigger manual redeploy (or wait for auto-redeploy)

### Update Frontend App URL (if needed)
- [ ] Go to Vercel dashboard
- [ ] Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
- [ ] Redeploy (Vercel auto-redeploys on env var changes)

## 🧪 Testing Checklist

### Backend Tests
- [ ] Health endpoint works: `https://backend.onrender.com/health`
- [ ] Backend logs show "Socket.io server initialized"
- [ ] No errors in Render logs

### Frontend Tests
- [ ] App loads successfully
- [ ] No errors in browser console
- [ ] See "Socket connected: [id]" in console (or "HTTP Mode" badge)

### Feature Tests
- [ ] Sign up new account
- [ ] Receive verification email
- [ ] Verify email and login
- [ ] Create new room
- [ ] Copy room ID
- [ ] Open incognito/another browser
- [ ] Join room with room ID
- [ ] Send messages from both windows
- [ ] Messages appear in real-time (or within 2-3 seconds)
- [ ] Test room deletion (admin)
- [ ] Test leaving room
- [ ] Test profile update

## 📊 Monitoring Setup

### Render
- [ ] Check backend logs for errors
- [ ] Monitor CPU/Memory usage
- [ ] Set up alerts (optional)

### Vercel
- [ ] Check deployment logs
- [ ] Check function logs
- [ ] Enable Analytics (optional)

### MongoDB Atlas
- [ ] Check connection count
- [ ] Monitor database size
- [ ] Set up backup (optional)

## 🔐 Security Checklist

- [ ] JWT_SECRET is random and secure (32+ characters)
- [ ] MongoDB user has minimal required permissions
- [ ] CORS configured correctly (no wildcard * in production)
- [ ] Environment variables not exposed in code
- [ ] .env files in .gitignore

## 🎉 Post-Deployment

### Documentation
- [ ] Update README with your production URLs
- [ ] Document any custom configuration
- [ ] Share access instructions with users

### Optional Enhancements
- [ ] Set up custom domain (Vercel & Render support this)
- [ ] Enable HTTPS (automatic on both platforms)
- [ ] Add error monitoring (Sentry)
- [ ] Add analytics (Google Analytics)
- [ ] Set up staging environment

## 🐛 Troubleshooting

If something doesn't work, check:

### Backend Issues
- [ ] Render logs for errors
- [ ] MONGODB_URI is correct
- [ ] FRONTEND_URL matches your Vercel URL exactly
- [ ] Health endpoint responds
- [ ] Port 3001 isn't blocked

### Frontend Issues
- [ ] Vercel build succeeded
- [ ] All environment variables set
- [ ] NEXT_PUBLIC_SOCKET_URL points to backend
- [ ] Browser console for errors
- [ ] Network tab for failed requests

### Connection Issues
- [ ] Backend is running (check Render)
- [ ] CORS configured correctly
- [ ] URLs don't have trailing slashes
- [ ] HTTPS (not HTTP) in production URLs

### Database Issues
- [ ] MongoDB Atlas cluster is running
- [ ] IP whitelist includes 0.0.0.0/0
- [ ] Connection string is correct
- [ ] User credentials are valid

## 📞 Getting Help

If you encounter issues:

1. **Check logs**
   - Render: Dashboard → Service → Logs
   - Vercel: Dashboard → Deployment → Function Logs
   - Browser: F12 → Console

2. **Common fixes**
   - Redeploy both services
   - Clear browser cache
   - Check all environment variables
   - Verify MongoDB connection

3. **Documentation**
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
   - [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture overview
   - [backend/README.md](backend/README.md) - Backend documentation

## ✅ Success Indicators

Your deployment is successful when:

- ✅ Backend health endpoint returns `{"status":"ok"}`
- ✅ Frontend loads without errors
- ✅ Browser console shows "Socket connected: [id]"
- ✅ Can create account and receive verification email
- ✅ Can create and join rooms
- ✅ Messages send and appear in real-time
- ✅ Room deletion works
- ✅ No console errors or warnings

---

## 🎊 Congratulations!

Once all items are checked, your GhostTalk app is successfully deployed with separated architecture!

**Frontend**: https://your-app.vercel.app
**Backend**: https://your-backend.onrender.com

Share your app and enjoy real-time chatting! 🚀
