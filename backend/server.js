// Load environment variables
require('dotenv').config()

const { createServer } = require('http')
const { Server } = require('socket.io')
const mongoose = require('mongoose')

// Database connection
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI)
      console.log('✓ MongoDB connected')
    }
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
}

// Import models
const Message = require('./models/Message')
const Media = require('./models/Media')
const Room = require('./models/Room')
const User = require('./models/User')

const PORT = process.env.PORT || 3001

// Create HTTP server
const httpServer = createServer()

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Store connected users
const connectedUsers = new Map() // socket.id -> { userId, roomId, userName }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Join room
  socket.on('join-room', async ({ roomId, userId, userName }) => {
    try {
      await connectDB()

      // Check if room exists
      const room = await Room.findOne({ roomId })
      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      // Check if user is already in room
      const isParticipant = room.participants.some(
        p => p.userId.toString() === userId
      )

      if (!isParticipant) {
        // Add user to room
        room.participants.push({ userId, joinedAt: new Date() })
        await room.save()
      }

      // Join socket room
      socket.join(roomId)
      console.log(`✓ Socket ${socket.id} joined room ${roomId}`)

      // Store user info
      connectedUsers.set(socket.id, { userId, roomId, userName })

      // Get all messages for this room
      const messages = await Message.find({ roomId })
        .sort({ timestamp: 1 })
        .lean()

      // Format messages with media info
      const formattedMessages = messages.map(msg => ({
        ...msg,
        type: msg.type || 'text',
      }))

      // Send existing messages to the new user
      socket.emit('room-messages', formattedMessages)

      // Get updated participant list
      const populatedRoom = await Room.findOne({ roomId }).populate('participants.userId')
      const participantList = populatedRoom.participants.map(p => ({
        id: p.userId._id,
        name: p.userId.name,
        avatar: p.userId.avatar,
        isAdmin: p.userId._id.toString() === room.adminId.toString(),
      }))

      // Notify room about new participant
      io.to(roomId).emit('participants-update', participantList)
      io.to(roomId).emit('user-joined', { userName })

      console.log(`User ${userName} joined room ${roomId}`)
    } catch (error) {
      console.error('Join room error:', error)
      socket.emit('error', { message: 'Failed to join room' })
    }
  })

  // Send message
  socket.on('send-message', async ({ roomId, userId, userName, message }) => {
    try {
      await connectDB()

      // Save message to database
      const newMessage = await Message.create({
        roomId,
        senderId: userId,
        senderName: userName,
        message,
        timestamp: new Date(),
      })

      // Broadcast message to all users in room
      io.to(roomId).emit('new-message', {
        _id: newMessage._id,
        roomId: newMessage.roomId,
        senderId: newMessage.senderId,
        senderName: newMessage.senderName,
        message: newMessage.message,
        timestamp: newMessage.timestamp,
      })

      console.log(`Message sent in room ${roomId} by ${userName}`)
    } catch (error) {
      console.error('Send message error:', error)
      socket.emit('error', { message: 'Failed to send message' })
    }
  })

  // Send media
  socket.on('send-media', async ({ roomId, userId, userName, mediaId, messageId, fileName, mimeType, fileSize }) => {
    try {
      await connectDB()

      // Get the saved message
      const message = await Message.findById(messageId)
      if (!message) {
        socket.emit('error', { message: 'Message not found' })
        return
      }

      // Broadcast media message to all users in room
      io.to(roomId).emit('new-media', {
        _id: message._id,
        roomId: message.roomId,
        senderId: message.senderId,
        senderName: userName,
        message: message.message,
        type: 'media',
        mediaId: message.mediaId,
        fileName,
        mimeType,
        fileSize,
        timestamp: message.timestamp,
      })

      console.log(`Media sent in room ${roomId} by ${userName}`)
    } catch (error) {
      console.error('Send media error:', error)
      socket.emit('error', { message: 'Failed to send media' })
    }
  })

  // Typing indicator
  socket.on('typing', ({ roomId, userName, isTyping }) => {
    socket.to(roomId).emit('user-typing', { userName, isTyping })
  })

  // Leave room
  socket.on('leave-room', async ({ roomId, userId }) => {
    try {
      await handleUserLeaveRoom(socket, roomId, userId, true) // true = permanent leave
    } catch (error) {
      console.error('Leave room error:', error)
    }
  })

  // Disconnect
  socket.on('disconnect', async () => {
    const userInfo = connectedUsers.get(socket.id)
    if (userInfo) {
      // Just leave the socket room, don't remove from database
      // This allows page reloads without deleting the room
      socket.leave(userInfo.roomId)
      connectedUsers.delete(socket.id)
      console.log(`User disconnected: ${socket.id} from room ${userInfo.roomId}`)
    } else {
      console.log('User disconnected:', socket.id)
    }
  })
})

// Handle user leaving room
async function handleUserLeaveRoom(socket, roomId, userId, permanentLeave = false) {
  await connectDB()

  const room = await Room.findOne({ roomId })
  if (!room) return

  // Only remove from database if it's a permanent leave (not just disconnect/reload)
  if (permanentLeave) {
    // Check if the leaving user is the admin
    const isAdmin = room.adminId.toString() === userId

    // Remove user from participants
    room.participants = room.participants.filter(
      p => p.userId.toString() !== userId
    )

    // Check if room should be deleted
    const shouldDelete = room.isDeleted || isAdmin || room.participants.length === 0

    if (shouldDelete) {
      // Delete all media files
      await Media.deleteMany({ roomId })
      
      // Delete all messages
      await Message.deleteMany({ roomId })
      
      // Delete room
      await Room.deleteOne({ roomId })
      
      const reason = room.isDeleted ? 'marked as deleted and all participants left' : 
                     isAdmin ? 'admin left' : 'no participants'
      console.log(`Room ${roomId} deleted (${reason})`)
      
      // Notify all remaining users that room is deleted (if admin leaving and others still there)
      if (isAdmin && !room.isDeleted && room.participants.length > 0) {
        io.to(roomId).emit('room-deleted', { 
          message: 'Admin has left the room. Room will be deleted.' 
        })
      }
    } else {
      await room.save()

      // Get updated participant list
      const populatedRoom = await Room.findOne({ roomId }).populate('participants.userId')
      const participantList = populatedRoom.participants.map(p => ({
        id: p.userId._id,
        name: p.userId.name,
        avatar: p.userId.avatar,
        isAdmin: p.userId._id.toString() === room.adminId.toString(),
      }))

      // Notify remaining users
      io.to(roomId).emit('participants-update', participantList)
    }
  }

  socket.leave(roomId)
}

// HTTP endpoints
httpServer.on('request', (req, res) => {
  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }))
    return
  }
  
  // Room deleted notification endpoint
  if (req.url === '/api/room-deleted' && req.method === 'POST') {
    // Set CORS headers
    const origin = req.headers.origin || process.env.FRONTEND_URL
    res.setHeader('Access-Control-Allow-Origin', origin || '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', async () => {
      try {
        console.log('=== Backend: Received room-deleted notification ===')
        const { roomId, message } = JSON.parse(body)
        console.log('Room ID:', roomId)
        console.log('Message:', message)
        
        if (!roomId) {
          console.error('Error: No roomId provided')
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'roomId is required' }))
          return
        }
        
        // Get all sockets in the room
        const socketsInRoom = await io.in(roomId).fetchSockets()
        console.log(`Sockets currently in room ${roomId}: ${socketsInRoom.length}`)
        socketsInRoom.forEach((socket, index) => {
          console.log(`  Socket ${index + 1}: ${socket.id}`)
        })
        
        // Emit room-deleted event to all users in the room
        io.to(roomId).emit('room-deleted', { 
          message: message || 'This room has been deleted',
          roomId: roomId
        })
        
        console.log(`✓ Emitted room-deleted event to ${socketsInRoom.length} sockets in room ${roomId}`)
        console.log('=== Backend: Room-deleted notification complete ===')
        
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ 
          success: true, 
          message: 'Event emitted',
          socketsNotified: socketsInRoom.length
        }))
      } catch (error) {
        console.error('Error processing room-deleted request:', error)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Internal server error' }))
      }
    })
    return
  }
  
  // Handle OPTIONS preflight for CORS
  if (req.url === '/api/room-deleted' && req.method === 'OPTIONS') {
    const origin = req.headers.origin || process.env.FRONTEND_URL
    res.setHeader('Access-Control-Allow-Origin', origin || '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.writeHead(204)
    res.end()
    return
  }
})

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Socket.IO backend server running on port ${PORT}`)
  console.log(`📡 Accepting connections from: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...')
  httpServer.close(() => {
    console.log('Server closed')
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed')
      process.exit(0)
    })
  })
})
