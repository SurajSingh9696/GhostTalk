import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Room from '@/lib/models/Room'
import Message from '@/lib/models/Message'
import Media from '@/lib/models/Media'
import { requireAuth } from '@/lib/middleware/auth'
import { getSocketServer } from '@/lib/socket/server'

export async function DELETE(request) {
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

    const room = await Room.findOne({ roomId })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    // Check if user is admin
    if (room.adminId.toString() !== session.user._id.toString()) {
      return NextResponse.json(
        { error: 'Only admin can delete the room' },
        { status: 403 }
      )
    }

    // Mark room as deleted (don't delete from DB yet)
    room.isDeleted = true
    room.deletedAt = new Date()
    await room.save()
    
    console.log(`Room ${roomId} marked as deleted`)

    // Notify all participants via Socket.io
    const io = getSocketServer()
    console.log('Socket IO instance:', io ? 'Available' : 'Not available')
    
    if (io) {
      // Get all sockets in the room
      const socketsInRoom = await io.in(roomId).fetchSockets()
      console.log(`Sockets in room ${roomId}:`, socketsInRoom.length)
      
      // Emit to room
      io.to(roomId).emit('room-deleted', { 
        message: 'This room has been deleted by the admin',
        roomId: roomId
      })
      console.log(`✓ Emitted room-deleted event to room ${roomId}`)
    } else {
      console.error('⚠ Socket server not available!')
    }

    // Note: Room will be deleted from DB when all participants leave
    // This is handled in the socket disconnect handler

    return NextResponse.json({
      success: true,
      message: 'Room deleted successfully',
    })
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Delete room error:', error)
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    )
  }
}
