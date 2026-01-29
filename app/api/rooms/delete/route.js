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
    console.log('=== Room Deletion: Starting backend notification ===')
    try {
      // Use SOCKET_URL for server-side requests (not NEXT_PUBLIC_SOCKET_URL)
      const socketUrl = process.env.SOCKET_URL
      console.log('SOCKET_URL:', socketUrl || 'NOT SET')
      
      if (!socketUrl) {
        console.error('⚠ SOCKET_URL not configured - participants will NOT be notified in real-time')
        console.error('⚠ Set SOCKET_URL environment variable to your backend URL')
      } else {
        // Make HTTP request to backend to emit the event
        const notifyUrl = `${socketUrl}/api/room-deleted`
        console.log(`Sending notification to: ${notifyUrl}`)
        console.log(`Room ID: ${roomId}`)
        
        const response = await fetch(notifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            message: 'This room has been deleted by the admin'
          }),
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        
        console.log(`Backend response status: ${response.status}`)
        
        if (response.ok) {
          const result = await response.json()
          console.log(`✓ Backend successfully notified:`, result)
        } else {
          const errorText = await response.text()
          console.error(`⚠ Backend notification failed: ${response.status} - ${errorText}`)
        }
      }
    } catch (socketError) {
      console.error('Socket notification error (non-critical):', socketError)
      console.error('Error details:', socketError.message)
    }
    console.log('=== Room Deletion: Backend notification complete ===')

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
