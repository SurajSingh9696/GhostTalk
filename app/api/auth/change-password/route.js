import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import User from '@/lib/models/User'
import Auth from '@/lib/models/Auth'
import { comparePassword, hashPassword } from '@/lib/utils/password'
import { requireAuth } from '@/lib/middleware/auth'

export async function POST(request) {
  try {
    const session = await requireAuth()
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findById(session.user._id)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get auth record
    const auth = await Auth.findOne({ userId: user._id })

    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication record not found' },
        { status: 404 }
      )
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, auth.hashedPassword)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Hash new password
    const newHashedPassword = await hashPassword(newPassword)
    auth.hashedPassword = newHashedPassword
    await auth.save()

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}
