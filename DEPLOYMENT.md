# GhostTalk Deployment Guide

This guide covers deploying GhostTalk to various platforms and troubleshooting common issues.

## 🎯 Quick Deploy

### Render (Recommended - Full Features)

**Why Render?** Supports custom Node.js servers, enabling full Socket.IO functionality with typing indicators and instant message delivery.

1. **Prepare Repository**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `ghosttalk` (or your preferred name)
     - **Region**: Choose closest to your users
     - **Branch**: `main`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Instance Type**: Free (or higher for better performance)

3. **Environment Variables**
   Add these in the Render dashboard:
   ```env
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ghosttalk
   JWT_SECRET=your_random_secret_minimum_32_chars
   RESEND_API_KEY=re_your_resend_api_key
   NEXT_PUBLIC_APP_URL=https://your-app-name.onrender.com
   NEXT_PUBLIC_SOCKET_URL=https://your-app-name.onrender.com
   NODE_ENV=production
   ```

4. **Deploy** - Click "Create Web Service"

### Vercel (HTTP Mode - No WebSockets)

**Why Vercel?** Great for quick deployments but doesn't support WebSockets. App automatically uses HTTP polling fallback.

1. **Install Vercel CLI** (optional)
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   - Via CLI: `vercel --prod`
   - Via Dashboard: Import from GitHub at [vercel.com](https://vercel.com)

3. **Environment Variables**
   Add these in Vercel dashboard or `.env.production`:
   ```env
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ghosttalk
   JWT_SECRET=your_random_secret_minimum_32_chars
   RESEND_API_KEY=re_your_resend_api_key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
   
   **⚠️ Important**: Do NOT set `NEXT_PUBLIC_SOCKET_URL` on Vercel. The app will automatically detect and use HTTP fallback mode.

### Railway

Similar to Render:

1. Connect GitHub repository
2. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. Add environment variables (same as Render)
4. Deploy

## 🔧 Troubleshooting

### Issue: Messages Not Sending in Production

**Symptoms:**
- Messages don't appear when sent
- Other users don't see your messages
- Console shows Socket.IO connection errors

**Solutions:**

1. **Check if Socket.IO is Available**
   - Open browser console (F12)
   - Look for "Socket connected" message
   - If you see "Switching to HTTP fallback", Socket.IO is not available

2. **For Vercel/Serverless Platforms**
   - This is expected behavior
   - The app should automatically switch to HTTP fallback
   - Messages will work via API polling (2-second delay)
   - Verify you see "HTTP Mode" badge in the UI

3. **For Render/VPS Platforms**
   - Verify `NEXT_PUBLIC_SOCKET_URL` is set correctly
   - Should match your app URL: `https://your-app.onrender.com`
   - No trailing slash
   - Must be HTTPS in production

4. **Test HTTP Fallback Manually**
   - Try sending a message
   - Open Network tab in browser dev tools
   - You should see POST requests to `/api/messages/send`
   - New messages should appear within 2-3 seconds

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
