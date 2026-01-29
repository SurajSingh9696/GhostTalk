import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Message from '@/lib/models/Message'
import Room from '@/lib/models/Room'
import { requireAuth } from '@/lib/middleware/auth'
import { getSocketServer } from '@/lib/socket/server'

export async function POST(request) {
  try {
    const session = await requireAuth()
    const { roomId, message } = await request.json()

    if (!roomId || !message || !message.trim()) {
      return NextResponse.json(
        { error: 'Room ID and message are required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Verify room exists and is not deleted
    const room = await Room.findOne({ roomId })
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    if (room.isDeleted) {
      return NextResponse.json(
        { error: 'This room has been deleted' },
        { status: 410 }
      )
    }

    // Verify user is a participant
    const isParticipant = room.participants.some(
      p => p.userId.toString() === session.user._id.toString()
    )

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant of this room' },
        { status: 403 }
      )
    }

    // Create message
    const newMessage = await Message.create({
      roomId,
      senderId: session.user._id,
      senderName: session.user.name,
      message: message.trim(),
      timestamp: new Date(),
    })

    // Try to broadcast via Socket.IO if available
    try {
      const io = getSocketServer()
      if (io) {
        io.to(roomId).emit('new-message', {
          _id: newMessage._id,
          roomId: newMessage.roomId,
          senderId: newMessage.senderId,
          senderName: newMessage.senderName,
          message: newMessage.message,
          timestamp: newMessage.timestamp,
        })
        console.log(`Message broadcast via Socket.IO to room ${roomId}`)
      }
    } catch (socketError) {
      console.log('Socket.IO not available, message saved to DB only:', socketError.message)
    }

    return NextResponse.json({
      success: true,
      message: {
        _id: newMessage._id,
        roomId: newMessage.roomId,
        senderId: newMessage.senderId,
        senderName: newMessage.senderName,
        message: newMessage.message,
        timestamp: newMessage.timestamp,
      },
    })
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
