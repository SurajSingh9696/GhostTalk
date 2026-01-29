# Real-Time Room Deletion Fix

## Changes Made

### 1. **Environment Variables**
Added `SOCKET_URL` for server-side communication:

**`.env.local` (Frontend)**
```env
# Client-side URL (browser)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Server-side URL (API routes)
SOCKET_URL=http://localhost:3001
```

**For Production (Vercel):**
Add both environment variables with your backend URL:
- `NEXT_PUBLIC_SOCKET_URL`: `https://your-backend.onrender.com`
- `SOCKET_URL`: `https://your-backend.onrender.com`

### 2. **Backend Endpoint**
Added `/api/room-deleted` endpoint with CORS support to handle room deletion notifications from frontend API.

### 3. **Room Deletion Flow**
1. Admin clicks delete → Frontend API deletes room from DB
2. Frontend API sends HTTP POST to backend `/api/room-deleted`
3. Backend emits Socket.IO event to all participants
4. Participants receive event and are redirected to dashboard

## Testing

### Local Development:
1. **Start Backend:** `cd backend && npm start`
2. **Start Frontend:** `npm run dev`
3. **Test:** Create room → Join with 2+ users → Admin deletes → Others should redirect

### Deployment:
1. **Deploy Backend to Render**
2. **Set Vercel Environment Variables:**
   - `SOCKET_URL`: Your Render backend URL
   - `NEXT_PUBLIC_SOCKET_URL`: Same URL
3. **Test:** Create room → Join from different devices → Admin deletes → All redirect

## Troubleshooting

If participants still don't redirect:

1. **Check Backend Logs:** Should see "Emitted room-deleted event to room [roomId]"
2. **Check Frontend Logs:** Should see "Room deleted event received"
3. **Verify Environment Variable:** `console.log(process.env.SOCKET_URL)` in delete route
4. **Check Network:** Backend should be accessible from Vercel servers

## Notes
- Room is deleted from database immediately (works without Socket.IO)
- Real-time notification is optional but provides better UX
- If backend unreachable, admin still deletes room, but participants need to refresh
