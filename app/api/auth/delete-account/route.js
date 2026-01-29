import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import User from '@/lib/models/User'
import Room from '@/lib/models/Room'
import Message from '@/lib/models/Message'
import Media from '@/lib/models/Media'
import { requireAuth } from '@/lib/middleware/auth'
import { cookies } from 'next/headers'

export async function DELETE(request) {
  try {
    const session = await requireAuth()
    const userId = session.user._id

    await connectDB()

    // Find all rooms where user is admin
    const adminRooms = await Room.find({ adminId: userId })

    // Delete all rooms created by this user (including their messages and media)
    for (const room of adminRooms) {
      await Media.deleteMany({ roomId: room.roomId })
      await Message.deleteMany({ roomId: room.roomId })
      await Room.deleteOne({ roomId: room.roomId })
    }

    // Remove user from rooms where they are a participant
    await Room.updateMany(
      { 'participants.userId': userId },
      { $pull: { participants: { userId } } }
    )

    // Delete all messages sent by this user
    await Message.deleteMany({ senderId: userId })

    // Delete all media uploaded by this user
    await Media.deleteMany({ senderId: userId })

    // Finally, delete the user account
    await User.findByIdAndDelete(userId)

    // Clear auth cookie
    const cookieStore = await cookies()
    cookieStore.delete('token')

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
