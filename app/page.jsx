'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          // User is logged in, redirect to dashboard
          router.push('/dashboard')
        } else {
          setLoading(false)
        }
      } catch (error) {
        setLoading(false)
      }
    }
    
    checkAuth()

    // Mouse parallax effect
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-teal-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-2xl font-bold gradient-text animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"
          style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
        ></div>
        <div 
          className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow delay-200"
          style={{ transform: `translate(${-mousePosition.x}px, ${mousePosition.y}px)` }}
        ></div>
        <div 
          className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow delay-400"
          style={{ transform: `translate(${mousePosition.x * 0.5}px, ${-mousePosition.y * 0.5}px)` }}
        ></div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 sm:py-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 sm:mb-20 animate-fadeInDown">
            <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-cyan-600/10 to-teal-600/10 rounded-full border border-cyan-200 animate-fadeIn">
              <span className="text-cyan-700 font-semibold text-sm">✨ Real-time Messaging Platform</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Welcome to{' '}
              <span className="gradient-text animate-gradient-x bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-600">
                GhostTalk
              </span>
            </h1>
            <p className="text-lg sm:text-2xl text-gray-600 max-w-3xl mx-auto font-inter leading-relaxed">
              Connect instantly with friends and colleagues in temporary chat rooms. 
              <br className="hidden sm:block" />
              <span className="font-semibold text-cyan-600">Simple, secure, and temporary</span> messaging for everyone.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-20">
            <div className="card-glass hover-lift hover-glow animate-fadeInUp group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 font-space-grotesk">Instant Messaging</h3>
              <p className="text-gray-600 font-inter">Real-time chat with Socket.io for seamless communication</p>
            </div>

            <div className="card-glass hover-lift hover-glow animate-fadeInUp delay-200 group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 font-space-grotesk">Temporary Rooms</h3>
              <p className="text-gray-600 font-inter">Create or join rooms that auto-delete when empty</p>
            </div>

            <div className="card-glass hover-lift hover-glow animate-fadeInUp delay-400 group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 font-space-grotesk">User Presence</h3>
              <p className="text-gray-600 font-inter">See who's online and typing in real-time</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center max-w-md mx-auto mb-20 animate-fadeInUp delay-500">
            <Link
              href="/auth/login"
              className="w-full sm:w-auto btn-primary px-10 py-4 text-lg text-center font-semibold"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto btn-secondary px-10 py-4 text-lg text-center font-semibold"
            >
              Create Account
            </Link>
          </div>

          {/* How It Works Section */}
          <div className="mt-20 sm:mt-32 text-center">
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4 animate-fadeInUp">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-gray-600 text-lg mb-12 animate-fadeInUp delay-100">Get started in three simple steps</p>
            
            <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
              <div className="flex flex-col items-center animate-slideInLeft">
                <div className="relative mb-6">
                  <img src="/logo.svg" alt="GhostTalk Logo" className="w-20 h-20 mx-auto mb-6 animate-bounce-slow" />
                  <div className="absolute -inset-2 bg-cyan-200 rounded-3xl -z-10 blur-lg opacity-50"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 font-space-grotesk">Sign Up</h3>
                <p className="text-gray-600 font-inter">Create your account instantly with email and password</p>
              </div>
              
              <div className="flex flex-col items-center animate-slideInLeft delay-200">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-3xl flex items-center justify-center text-3xl font-bold shadow-2xl hover:scale-110 transition-transform duration-300">
                    2
                  </div>
                  <div className="absolute -inset-2 bg-teal-200 rounded-3xl -z-10 blur-lg opacity-50"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 font-space-grotesk">Create or Join</h3>
                <p className="text-gray-600 font-inter">Start a new room or join an existing one with a room ID</p>
              </div>
              
              <div className="flex flex-col items-center animate-slideInLeft delay-400">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-600 to-teal-600 text-white rounded-3xl flex items-center justify-center text-3xl font-bold shadow-2xl hover:scale-110 transition-transform duration-300">
                    3
                  </div>
                  <div className="absolute -inset-2 bg-cyan-200 rounded-3xl -z-10 blur-lg opacity-50"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 font-space-grotesk">Start Chatting</h3>
                <p className="text-gray-600 font-inter">Enjoy real-time conversations with your team</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-white/50 backdrop-blur-lg border-t border-gray-200 py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-gray-600 font-inter">
          <p className="text-sm sm:text-base">&copy; 2026 GhostTalk. Built with ❤️ using Next.js & Socket.io</p>
        </div>
      </footer>
    </div>
  )
}
