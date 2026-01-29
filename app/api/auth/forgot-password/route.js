import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import User from '@/lib/models/User'
import Auth from '@/lib/models/Auth'
import { generateOTP, getOTPExpiry } from '@/lib/utils/otp'
import { sendPasswordResetEmail } from '@/lib/utils/email'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset code.',
      })
    }

    const auth = await Auth.findOne({ userId: user._id })
    if (!auth) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset code.',
      })
    }

    // Generate OTP
    const otp = generateOTP()
    const otpExpiry = getOTPExpiry()

    auth.passwordResetOTP = otp
    auth.passwordResetExpiry = otpExpiry
    await auth.save()

    // Send email
    await sendPasswordResetEmail(email, user.name, otp)

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset code.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
