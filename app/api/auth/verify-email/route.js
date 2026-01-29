import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import User from '@/lib/models/User'
import Auth from '@/lib/models/Auth'
import { isOTPValid } from '@/lib/utils/otp'

export async function POST(request) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const auth = await Auth.findOne({ userId: user._id })
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication record not found' },
        { status: 404 }
      )
    }

    // Check if OTP is valid
    if (!isOTPValid(auth.emailVerificationExpiry)) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    if (auth.emailVerificationOTP !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      )
    }

    // Verify the email
    user.emailVerified = true
    await user.save()

    // Clear the OTP
    auth.emailVerificationOTP = null
    auth.emailVerificationExpiry = null
    await auth.save()

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. You can now login.',
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}
