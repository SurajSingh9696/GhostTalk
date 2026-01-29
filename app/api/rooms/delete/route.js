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

    // Directly delete room and related data from database
    // This ensures deletion works even without Socket.IO (Vercel/Render)
    
    // Delete all media files associated with this room
    await Media.deleteMany({ roomId })
    console.log(`Deleted media for room ${roomId}`)
    
    // Delete all messages in this room
    await Message.deleteMany({ roomId })
    console.log(`Deleted messages for room ${roomId}`)
    
    // Delete the room itself
    await Room.deleteOne({ roomId })
    console.log(`Room ${roomId} deleted from database`)

    // Notify participants via backend Socket.IO server
    try {
      // Use SOCKET_URL for server-side requests (not NEXT_PUBLIC_SOCKET_URL)
      const socketUrl = process.env.SOCKET_URL
      
      if (socketUrl) {
        // Make HTTP request to backend to emit the event
        const notifyUrl = `${socketUrl}/api/room-deleted`
        console.log(`Notifying backend at: ${notifyUrl}`)
        
        const response = await fetch(notifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            message: 'This room has been deleted by the admin'
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log(`✓ Backend notified about room deletion: ${roomId}`, result)
        } else {
          const errorText = await response.text()
          console.log(`⚠ Failed to notify backend: ${response.status} - ${errorText}`)
        }
      } else {
        console.log('⚠ SOCKET_URL not configured - participants may not be notified in real-time')
        console.log('⚠ Set SOCKET_URL environment variable to enable real-time notifications')
      }
    } catch (socketError) {
      console.error('Socket notification error (non-critical):', socketError.message)
    }

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
