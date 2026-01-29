# GhostTalk Deployment Guide

This guide covers deploying GhostTalk with its separated architecture: Frontend (Next.js) and Backend (Socket.IO).

## 🏗️ Architecture

GhostTalk now uses a separated architecture:

- **Frontend**: Next.js app (deployed to Vercel/Render)
- **Backend**: Socket.IO WebSocket server (deployed to Render)
- **Database**: MongoDB Atlas

This separation allows:
- ✅ Deploy frontend to Vercel (fast, free CDN)
- ✅ Deploy backend to Render (WebSocket support)
- ✅ Scale each service independently
- ✅ Better performance and reliability

## 🎯 Quick Deploy

### Step 1: Deploy Backend (Socket.IO Server)

**Deploy to Render first** - The frontend needs the backend URL.

1. **Create Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - **Important**: Set **Root Directory** to `backend`

2. **Configure Service**
   - **Name**: `ghosttalk-backend` (or your choice)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend` ⚠️ **IMPORTANT**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free or higher

3. **Environment Variables**
   ```env
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ghosttalk
   FRONTEND_URL=https://your-frontend-app.vercel.app
   PORT=3001
   ```
   
   **Note**: You'll update `FRONTEND_URL` after deploying frontend.

4. **Deploy Backend**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - **Copy the backend URL** (e.g., `https://ghosttalk-backend.onrender.com`)

### Step 2: Deploy Frontend (Next.js App)

**Deploy to Vercel** - Fast, free, and perfect for Next.js.

1. **Push Code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Environment Variables**
   Add these in Vercel dashboard:
   ```env
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ghosttalk
   JWT_SECRET=your_random_secret_minimum_32_chars
   RESEND_API_KEY=re_your_resend_api_key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   NEXT_PUBLIC_SOCKET_URL=https://ghosttalk-backend.onrender.com
   ```
   
   **Important**: Use the backend URL from Step 1 for `NEXT_PUBLIC_SOCKET_URL`

4. **Deploy Frontend**
   - Click "Deploy"
   - Wait for deployment
   - **Copy the frontend URL**

5. **Update Backend Environment Variable**
   - Go back to Render dashboard
   - Update `FRONTEND_URL` to your Vercel URL
   - Trigger a redeploy of the backend

### Alternative: Deploy Frontend to Render

If you prefer to deploy both on Render:

1. **Create Another Web Service**
   - **Root Directory**: Leave empty (use root)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

2. **Environment Variables** (same as Vercel above)

3. Both services can run on Render's free tier

### Step 3: Test Your Deployment

### Step 3: Test Your Deployment

1. **Check Backend Health**
   ```bash
   curl https://ghosttalk-backend.onrender.com/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

2. **Visit Your Frontend**
   - Go to your Vercel URL
   - Sign up / Login
   - Create a room
   - Send messages
   - Verify real-time updates work

3. **Check Browser Console**
   - Should see: "Socket connected: [id]"
   - No WebSocket connection errors

## 📋 Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://...        # Required: MongoDB connection
FRONTEND_URL=https://app.vercel.app  # Required: Your frontend URL for CORS
PORT=3001                            # Optional: Server port (default 3001)
```

### Frontend (.env.local)
```env
MONGODB_URI=mongodb+srv://...                      # Required: MongoDB connection
JWT_SECRET=your_secret_key                         # Required: For auth tokens
RESEND_API_KEY=re_xxx                             # Required: For emails
NEXT_PUBLIC_APP_URL=https://app.vercel.app        # Required: Your app URL
NEXT_PUBLIC_SOCKET_URL=https://backend.onrender.com # Required: Backend URL
NODE_ENV=production                                # Optional
```

## 🔧 Troubleshooting

### Issue: Frontend can't connect to backend

**Symptoms:**
- "Switching to HTTP fallback" in console after 10 seconds
- Messages work but with 2-3 second delay
- No real-time message updates
- Typing indicators don't work

**Solutions:**

1. **Verify NEXT_PUBLIC_SOCKET_URL is set**
   ```bash
   # In frontend .env.local or Vercel dashboard
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com
   ```
   - Must include `https://`
   - No trailing slash
   - Must match your backend URL exactly
   - Redeploy frontend after changing

2. **Check Backend CORS Configuration**
   - Backend `FRONTEND_URL` must match your frontend URL exactly
   - Example: `https://your-app.vercel.app` (no trailing slash)
   - Check backend logs: "Accepting connections from: ..."
   - Redeploy backend after changing

3. **Verify Backend is Running**
   ```bash
   curl https://your-backend.onrender.com/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

4. **Check Browser Console**
   ```javascript
   // Should see:
   "Attempting to connect to Socket.IO at: https://backend.onrender.com"
   "Socket connected: [socket-id]"
   
   // If you see:
   "Socket connection timeout - switching to HTTP fallback"
   // → Backend not reachable or CORS issue
   ```

5. **Test Backend Directly**
   - Open `https://your-backend.onrender.com/health` in browser
   - Should see JSON response with status "ok"
   - If connection refused → Backend not running
   - If 404 → Wrong URL

### Issue: Messages Not Sending in Production

**Symptoms:**
- Messages typed but don't appear
- Other users don't see messages
- No errors in console

**Solutions:**

1. **Check Socket.IO Connection**
   - Open browser console
   - Should see "Socket connected: [id]"
   - If not connected, see "Frontend can't connect" above

2. **Try HTTP Fallback Mode**
   - If Socket.IO fails, app should automatically use HTTP API
   - Check Network tab for POST to `/api/messages/send`
   - Messages should appear within 2-3 seconds

3. **Verify MongoDB Connection**
   - Check backend logs for MongoDB connection errors
   - Verify `MONGODB_URI` is set correctly in both services
   - Test connection by creating a room

4. **Check Backend Logs**
   - Go to Render Dashboard → Your Backend Service → Logs
   - Look for errors when sending messages
   - Should see: "Message sent in room [id] by [user]"

### Issue: Room Deletion Not Working

**Symptoms:**
- Clicking "Delete Room" does nothing
- Room still shows in database after deletion
- Users not kicked out of room

**Root Cause:** Previous version relied on Socket.IO for deletion, which doesn't work on serverless platforms.

**Fix Applied:** ✅
- Room now deletes directly from database
- Works with or without Socket.IO
- Participants receive notification if Socket.IO is available
- Otherwise, room is simply removed from database

**Verification:**
1. Admin clicks "Delete Room"
2. Should see success message
3. Admin redirected to dashboard
4. Check MongoDB - room, messages, and media should be deleted
5. Other participants redirected within 2-3 seconds (or on next page load)

### Issue: Socket.IO Connection Timeout

**Symptoms:**
- Page loads slowly
- See "Switching to HTTP fallback" after 10 seconds
- Yellow "HTTP Mode" badge appears

**Expected Behavior:**
- On Vercel/serverless: This is normal and expected
- On Render/VPS: Socket.IO should connect

**Solutions:**

1. **For Vercel** - This is correct behavior:
   ```
   ✅ Socket tries to connect → fails → switches to HTTP mode
   ```

2. **For Render** - If Socket.IO isn't connecting:
   - Check `NEXT_PUBLIC_SOCKET_URL` is set
   - Ensure URL is correct (no typos)
   - Verify server.js is running: Check logs for "Socket.io server initialized"
   - Try different transports: The app uses both websocket and polling

3. **Force HTTP Mode** (for testing):
   ```javascript
   // In room/[id]/page.jsx, line ~120
   // Comment out socket initialization
   setUseHttpFallback(true)
   startHttpPolling(userData)
   ```

### Issue: Environment Variables Not Working

**Symptoms:**
- 500 errors
- "Cannot connect to database"
- Authentication failures

**Solutions:**

1. **Verify All Required Variables Are Set**
   ```bash
   # Check your platform's dashboard
   # Required variables:
   - MONGODB_URI
   - JWT_SECRET
   - RESEND_API_KEY
   - NEXT_PUBLIC_APP_URL
   ```

2. **Check Variable Format**
   - No quotes around values in most platforms
   - No spaces before/after `=`
   - MongoDB URI should be properly URL encoded

3. **Restart After Adding Variables**
   - Most platforms require a rebuild/restart
   - Vercel: Redeploy
   - Render: Should auto-redeploy

4. **Local Testing**
   - Copy `.env.example` to `.env.local`
   - Fill in your values
   - Run `npm run dev`

### Issue: Email Verification Not Working

**Symptoms:**
- Users don't receive verification emails
- OTP codes not sent

**Solutions:**

1. **Verify Resend Setup**
   - Go to [Resend Dashboard](https://resend.com/domains)
   - Verify your sending domain
   - Check API key is active
   - Check email sending limits

2. **Check From Address**
   - In `lib/utils/email.js`
   - Must be from verified domain
   - Default: `onboarding@resend.dev` (works for testing)

3. **Test Email Locally**
   ```bash
   # In terminal
   curl -X POST http://localhost:3000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@test.com","password":"test123"}'
   ```

## 📊 Performance Optimization

### Socket.IO Mode (Render/VPS)
- **Latency**: <100ms message delivery
- **CPU**: Low (event-driven)
- **Scaling**: Needs sticky sessions for multiple instances

### HTTP Fallback Mode (Vercel)
- **Latency**: 2-3 seconds (polling interval)
- **CPU**: Higher (continuous polling)
- **Scaling**: Fully serverless, auto-scales

### Recommendations

- **High-traffic apps**: Use Render with Socket.IO
- **Low-traffic/hobby projects**: Vercel HTTP mode is fine
- **Cost-sensitive**: Vercel has generous free tier
- **Need typing indicators**: Must use Socket.IO mode

## 🔍 Debugging Tips

### Enable Verbose Logging

1. **Client-side (Browser Console)**
   ```javascript
   localStorage.debug = 'socket.io-client:*'
   ```

2. **Server-side (Render Logs)**
   - Go to Render Dashboard → Your Service → Logs
   - Watch for Socket.IO connection messages

### Test Endpoints Manually

```bash
# Test message API (HTTP fallback)
curl -X POST https://your-app.com/api/messages/send \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{"roomId":"test123","message":"Hello"}'

# Test message fetching
curl "https://your-app.com/api/messages?roomId=test123" \
  -H "Cookie: your_session_cookie"

# Test room deletion
curl -X DELETE https://your-app.com/api/rooms/delete \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{"roomId":"test123"}'
```

## 🚀 Post-Deployment Checklist

- [ ] App loads successfully
- [ ] User registration works
- [ ] Email verification works
- [ ] Login works
- [ ] Can create rooms
- [ ] Can join rooms
- [ ] Messages send and appear (within 2-3 seconds max)
- [ ] Room deletion works (admin)
- [ ] Users can leave rooms
- [ ] Profile updates work
- [ ] Mobile responsive
- [ ] No console errors (except expected Socket.IO on Vercel)

## 💡 Tips

1. **MongoDB Connection**
   - Use MongoDB Atlas for free hosted database
   - Whitelist `0.0.0.0/0` in Network Access (or your platform's IPs)

2. **JWT Secret**
   - Generate secure random string:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

3. **Cost Optimization**
   - Vercel: Free tier sufficient for most hobby projects
   - Render: Free tier (spins down after inactivity)
   - MongoDB Atlas: Free tier includes 512MB storage

4. **Custom Domain**
   - Both Render and Vercel support custom domains
   - Update `NEXT_PUBLIC_APP_URL` after adding domain
   - Update `NEXT_PUBLIC_SOCKET_URL` on Render

## 📞 Support

If you encounter issues not covered here:

1. Check browser console for errors
2. Check server logs (platform dashboard)
3. Verify all environment variables
4. Test with HTTP fallback mode
5. Check MongoDB connection
6. Verify Resend API key

## ✅ Success Indicators

**Socket.IO Mode (Render):**
- Console: "Socket connected: [id]"
- Messages appear instantly
- Typing indicators work
- No "HTTP Mode" badge

**HTTP Fallback Mode (Vercel):**
- Yellow "HTTP Mode" badge visible
- Console: "Switching to HTTP fallback"
- Messages appear within 2-3 seconds
- No typing indicators (expected)
- API calls visible in Network tab

Both modes work perfectly - just different user experiences!
