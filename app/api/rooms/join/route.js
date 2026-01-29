import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Room from '@/lib/models/Room'
import { requireAuth } from '@/lib/middleware/auth'

export async function POST(request) {
  try {
    const session = await requireAuth()
    const { roomId } = await request.json()

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const room = await Room.findOne({ roomId }).populate('adminId').populate('participants.userId')

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      room: {
        roomId: room.roomId,
        adminId: room.adminId._id,
        adminName: room.adminId.name,
        participants: room.participants.map(p => ({
          id: p.userId._id,
          name: p.userId.name,
          avatar: p.userId.avatar,
          joinedAt: p.joinedAt,
          isAdmin: p.userId._id.toString() === room.adminId._id.toString(),
        })),
        createdAt: room.createdAt,
      },
    })
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Join room error:', error)
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    )
  }
}
