import { NextResponse } from 'next/server'
import { getSession } from '@/lib/middleware/auth'

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: session.user._id,
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.avatar,
        emailVerified: session.user.emailVerified,
      },
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { error: 'Failed to check session' },
      { status: 500 }
    )
  }
}
