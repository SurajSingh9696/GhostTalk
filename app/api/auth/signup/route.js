import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import User from '@/lib/models/User'
import Auth from '@/lib/models/Auth'
import { hashPassword } from '@/lib/utils/password'

export async function POST(request) {
  try {
    const { name, email, password } = await request.json()

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
    })

    // Hash password and create auth record
    const hashedPassword = await hashPassword(password)

    await Auth.create({
      userId: user._id,
      hashedPassword,
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. You can now login.',
      userId: user._id,
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
