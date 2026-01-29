# GhostTalk Backend - Socket.IO Server

This is the standalone WebSocket server for GhostTalk, handling all real-time communication.

## 🚀 Quick Start

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   FRONTEND_URL=http://localhost:3000
   PORT=3001
   ```

3. **Start the server**
   ```bash
   npm start
   ```

The server will run on `http://localhost:3001`

### Production Deployment (Render)

1. **Create a new Web Service**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your repository
   - Set Root Directory to `backend`

2. **Configure Build Settings**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Environment Variables**
   ```env
   MONGODB_URI=your_mongodb_connection_string
   FRONTEND_URL=https://your-frontend-app.vercel.app
   PORT=3001
   ```

4. **Deploy**
   - Render will automatically deploy
   - Note the URL (e.g., `https://ghosttalk-backend.onrender.com`)
   - Use this URL in your frontend's `NEXT_PUBLIC_SOCKET_URL`

## 📡 API Endpoints

### Health Check
- **GET** `/health`
- Returns: `{ "status": "ok", "timestamp": "..." }`

### Socket.IO Events

#### Client → Server

- `join-room` - Join a chat room
  ```javascript
  socket.emit('join-room', { roomId, userId, userName })
  ```

- `send-message` - Send a text message
  ```javascript
  socket.emit('send-message', { roomId, userId, userName, message })
  ```

- `send-media` - Send a media message
  ```javascript
  socket.emit('send-media', { roomId, userId, userName, mediaId, messageId, fileName, mimeType, fileSize })
  ```

- `typing` - Send typing indicator
  ```javascript
  socket.emit('typing', { roomId, userName, isTyping })
  ```

- `leave-room` - Leave a room
  ```javascript
  socket.emit('leave-room', { roomId, userId })
  ```

#### Server → Client

- `room-messages` - Initial messages when joining room
- `new-message` - New message received
- `new-media` - New media message received
- `participants-update` - Participant list updated
- `user-joined` - User joined notification
- `user-typing` - Typing indicator
- `room-deleted` - Room was deleted
- `error` - Error message

## 🔧 Configuration

### CORS

The server accepts connections from the URL specified in `FRONTEND_URL`. Update this to match your frontend deployment.

```javascript
cors: {
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST'],
  credentials: true,
}
```

### Port

Default port is 3001. Change via `PORT` environment variable.

## 🐛 Debugging

### Enable verbose logging

Add to your environment:
```env
DEBUG=socket.io:*
```

### Check connection

```bash
curl http://localhost:3001/health
```

### Test Socket.IO connection

Open browser console on your frontend and check for:
```
Socket connected: [socket-id]
```

## 📊 Architecture

```
Frontend (Next.js)
    ↓ Socket.IO connection
Backend (This server)
    ↓ MongoDB connection
Database (MongoDB Atlas)
```

## 🔐 Security Notes

- MongoDB connection uses secure connection string
- CORS restricts connections to authorized frontend only
- No authentication tokens stored in backend (handled by frontend)
- Room access verified against MongoDB on each action

## 🚀 Performance

- Uses Socket.IO for efficient WebSocket communication
- Mongoose for optimized MongoDB queries
- Connection pooling enabled by default
- Graceful shutdown handling

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://app.vercel.app` |
| `PORT` | Server port | `3001` |

## 🔄 Deployment Updates

When deploying updates:

1. Push changes to your repository
2. Render will automatically detect and rebuild
3. No downtime with Render's zero-downtime deployment
4. Active Socket.IO connections gracefully transferred

## ⚠️ Important Notes

- Backend must be deployed BEFORE frontend on first deploy
- Frontend needs backend URL in `NEXT_PUBLIC_SOCKET_URL`
- Both frontend and backend must use same MongoDB database
- On Render free tier, backend may spin down after inactivity (cold starts)

## 🆘 Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Verify PORT is available
- Check environment variables are set

### Frontend can't connect
- Verify `FRONTEND_URL` matches your frontend domain
- Check `NEXT_PUBLIC_SOCKET_URL` in frontend
- Ensure backend is running and accessible

### Messages not sending
- Check backend logs for errors
- Verify MongoDB connection
- Check Socket.IO connection in browser console

## 📞 Support

For issues:
1. Check backend logs in Render dashboard
2. Verify environment variables
3. Test health endpoint
4. Check MongoDB connection
