import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Room from '@/lib/models/Room'
import { requireAuth } from '@/lib/middleware/auth'
import { v4 as uuidv4 } from 'uuid'

export async function POST() {
  try {
    const session = await requireAuth()

    await connectDB()

    // Generate unique room ID
    const roomId = uuidv4().split('-')[0].toUpperCase()

    const room = await Room.create({
      roomId,
      adminId: session.user._id,
      participants: [{
        userId: session.user._id,
        joinedAt: new Date(),
      }],
    })

    return NextResponse.json({
      success: true,
      message: 'Room created successfully',
      room: {
        roomId: room.roomId,
        adminId: room.adminId,
      },
    })
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Create room error:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}
