import { cookies } from 'next/headers'
import connectDB from '../db/mongodb'
import Session from '../models/Session'
import User from '../models/User'

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value

    if (!sessionToken) {
      return null
    }

    await connectDB()

    const session = await Session.findOne({
      sessionToken,
      expiresAt: { $gt: new Date() },
    }).populate('userId')

    if (!session) {
      return null
    }

    return {
      user: session.userId,
      sessionId: session._id,
    }
  } catch (error) {
    console.error('Session error:', error)
    return null
  }
}

export async function requireAuth() {
  const session = await getSession()
  
  if (!session) {
    throw new Error('Unauthorized')
  }

  return session
}

export async function createSession(userId, device = null, ip = null) {
  await connectDB()

  const sessionToken = require('crypto').randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const session = await Session.create({
    userId,
    sessionToken,
    expiresAt,
    device,
    ip,
  })

  return { sessionToken, expiresAt }
}

export async function deleteSession(sessionToken) {
  await connectDB()
  await Session.deleteOne({ sessionToken })
}
