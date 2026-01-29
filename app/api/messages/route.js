import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Message from '@/lib/models/Message'
import Room from '@/lib/models/Room'
import { requireAuth } from '@/lib/middleware/auth'

export async function GET(request) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const after = searchParams.get('after') // Timestamp to get messages after

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Verify room exists
    const room = await Room.findOne({ roomId })
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
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

    // Build query
    const query = { roomId }
    if (after) {
      query.timestamp = { $gt: new Date(after) }
    }

    // Get messages
    const messages = await Message.find(query)
      .sort({ timestamp: 1 })
      .lean()

    // Format messages
    const formattedMessages = messages.map(msg => ({
      ...msg,
      type: msg.type || 'text',
    }))

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      roomDeleted: room.isDeleted || false,
    })
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    )
  }
}
