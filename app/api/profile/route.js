import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import User from '@/lib/models/User'
import { requireAuth } from '@/lib/middleware/auth'

export async function GET() {
  try {
    const session = await requireAuth()

    return NextResponse.json({
      user: {
        id: session.user._id,
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.avatar,
        emailVerified: session.user.emailVerified,
        createdAt: session.user.createdAt,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: 401 }
    )
  }
}

export async function PUT(request) {
  try {
    const session = await requireAuth()
    const { name, avatar } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findByIdAndUpdate(
      session.user._id,
      { 
        name: name.trim(), 
        avatar: avatar || session.user.avatar,
        updatedAt: Date.now(),
      },
      { new: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
