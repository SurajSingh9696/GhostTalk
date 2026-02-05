'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { getUserFriendlyError, logError } from '@/lib/utils/errorHandler'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showJoinRoom, setShowJoinRoom] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [roomId, setRoomId] = useState('')
  const [profileData, setProfileData] = useState({ name: '', avatar: '' })
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPasswordSection, setShowPasswordSection] = useState(false)

  // Random avatar options
  const avatarOptions = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily',
  ]

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/auth/login')
        return
      }
      const data = await response.json()
      setUser(data.user)
      setProfileData({ name: data.user.name, avatar: data.user.avatar || '' })
      setSelectedAvatar(data.user.avatar || '')
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async () => {
    const loadingToast = toast.loading('Creating room...')
    try {
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create room')
      }

      toast.success('Room created successfully!', { id: loadingToast })
      router.push(`/room/${data.room.roomId}`)
    } catch (err) {
      logError('Create Room', err)
      toast.error(getUserFriendlyError(err, 'Failed to create room'), { id: loadingToast })
    }
  }

  const handleJoinRoom = async (e) => {
    e.preventDefault()

    if (!roomId.trim()) {
      toast.error('Please enter a room ID')
      return
    }

    const loadingToast = toast.loading('Joining room...')
    try {
      const response = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: roomId.trim().toUpperCase() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join room')
      }

      toast.success('Joined room successfully!', { id: loadingToast })
      router.push(`/room/${roomId.trim().toUpperCase()}`)
    } catch (err) {
      logError('Join Room', err)
      toast.error(getUserFriendlyError(err, 'Failed to join room'), { id: loadingToast })
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()

    const loadingToast = toast.loading('Updating profile...')
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setUser(data.user)
      toast.success('Profile updated successfully!', { id: loadingToast })
      setShowProfile(false)
    } catch (err) {
      logError('Update Profile', err)
      toast.error(getUserFriendlyError(err, 'Failed to update profile'), { id: loadingToast })
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    const loadingToast = toast.loading('Changing password...')
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      toast.success('Password changed successfully!', { id: loadingToast })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordSection(false)
    } catch (err) {
      logError('Change Password', err)
      toast.error(getUserFriendlyError(err, 'Failed to change password'), { id: loadingToast })
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.'
    )

    if (!confirmed) return

    const doubleConfirm = confirm(
      'This is your last chance! Are you absolutely sure you want to delete your account?'
    )

    if (!doubleConfirm) return

    const loadingToast = toast.loading('Deleting account...')
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      toast.success('Account deleted successfully. Goodbye!', { id: loadingToast })
      setTimeout(() => {
        router.push('/auth/signup')
      }, 2000)
    } catch (err) {
      logError('Delete Account', err)
      toast.error(getUserFriendlyError(err, 'Failed to delete account'), { id: loadingToast })
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('Logged out successfully')
      router.push('/auth/login')
    } catch (error) {
      logError('Logout', error)
      toast.error('Logout failed. Please try again')
    }
  }

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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow delay-200"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 animate-slideInLeft">
            <img src="/logo.svg" alt="GhostTalk Logo" className="w-10 h-10 sm:w-12 sm:h-12" />
            <h1 className="text-xl sm:text-3xl font-bold gradient-text font-space-grotesk">GhostTalk</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 animate-slideInRight">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-cyan-100 to-teal-100 rounded-xl">
              {user?.avatar && (
                <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
              )}
              <span className="text-sm font-medium text-gray-700">Hello, <span className="font-bold text-cyan-600">{user?.name}</span></span>
            </div>
            <button
              onClick={() => setShowProfile(true)}
              className="btn-glass text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 font-semibold bg-gradient-to-r from-cyan-600 to-teal-600 text-white border-none hover:from-cyan-700 hover:to-teal-700"
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
            <button 
              onClick={handleLogout} 
              className="btn-secondary text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 font-semibold hover:bg-red-50 hover:border-red-300 hover:text-red-600"
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="text-center mb-12 sm:mb-16 animate-fadeInDown">
          <h2 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 font-space-grotesk">
            Start <span className="gradient-text">Chatting</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 font-inter max-w-2xl mx-auto">
            Create a new room or join an existing one to start your conversation
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {/* Create Room Card */}
          <div className="card-glass hover-lift hover-glow group animate-fadeInUp flex flex-col">
            <div className="text-center flex-1 flex flex-col">
              <div className="relative mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="absolute -inset-3 bg-cyan-200 rounded-3xl -z-10 blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 font-space-grotesk">Create Room</h3>
              <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 font-inter flex-1">
                Start a new chat room and invite others to join
              </p>
              <button
                onClick={handleCreateRoom}
                className="btn-primary w-full text-base sm:text-lg py-4 font-semibold"
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Create New Room
              </button>
            </div>
          </div>

          {/* Join Room Card */}
          <div className="card-glass hover-lift hover-glow group animate-fadeInUp delay-200 flex flex-col">
            <div className="text-center flex-1 flex flex-col">
              <div className="relative mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div className="absolute -inset-3 bg-pink-200 rounded-3xl -z-10 blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 font-space-grotesk">Join Room</h3>
              <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 font-inter flex-1">
                Enter a room ID to join an existing chat
              </p>
              <button
                onClick={() => setShowJoinRoom(true)}
                className="btn-primary w-full text-base sm:text-lg py-4 font-semibold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Join Room
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Join Room Modal */}
      {showJoinRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-scaleIn border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl sm:text-3xl font-bold gradient-text font-space-grotesk">Join Room</h3>
              <button
                onClick={() => {
                  setShowJoinRoom(false)
                  setRoomId('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleJoinRoom} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 font-inter">
                  Room ID
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="input-field text-center text-2xl sm:text-3xl tracking-widest font-bold font-space-grotesk"
                  placeholder="XXXXXXXX"
                  maxLength={8}
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinRoom(false)
                    setRoomId('')
                  }}
                  className="btn-secondary flex-1 text-base sm:text-lg font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 text-base sm:text-lg font-semibold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                  Join Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-3xl w-full p-4 sm:p-6 md:p-8 my-2 sm:my-8 max-h-[95vh] overflow-y-auto animate-scaleIn border border-gray-100 scrollbar-hide">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl sm:text-3xl font-bold gradient-text font-space-grotesk">Edit Profile</h3>
              <button
                onClick={() => {
                  setShowProfile(false)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Avatar Selection */}
              <div className="bg-gradient-to-br from-cyan-50 to-teal-50 p-4 sm:p-6 rounded-2xl">
                <label className="block text-sm font-semibold text-gray-700 mb-3 sm:mb-4 font-inter flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Choose Your Avatar
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3 md:gap-4 mb-4">
                  {avatarOptions.map((avatar, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(avatar)
                        setProfileData({ ...profileData, avatar })
                      }}
                      className={`relative rounded-2xl overflow-hidden transition-all transform hover:scale-110 ${
                        selectedAvatar === avatar || profileData.avatar === avatar
                          ? 'ring-4 ring-cyan-600 shadow-2xl scale-110 shadow-cyan-500/50'
                          : 'hover:ring-2 hover:ring-gray-300 shadow-lg'
                      }`}
                    >
                      <img
                        src={avatar}
                        alt={`Avatar ${index + 1}`}
                        className="w-full h-full object-cover bg-white"
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 font-inter">💡 Or enter a custom avatar URL below</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 font-inter flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Name
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="input-field text-base sm:text-lg font-medium"
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 font-inter flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Custom Avatar URL (optional)
                </label>
                <input
                  type="url"
                  value={profileData.avatar}
                  onChange={(e) => {
                    setProfileData({ ...profileData, avatar: e.target.value })
                    setSelectedAvatar(e.target.value)
                  }}
                  className="input-field text-sm sm:text-base"
                  placeholder="https://example.com/avatar.png"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 font-inter flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email (cannot be changed)
                </label>
                <input
                  type="email"
                  value={user?.email}
                  className="input-field bg-gray-100 text-gray-500 cursor-not-allowed text-sm sm:text-base"
                  disabled
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false)
                  }}
                  className="btn-secondary flex-1 text-base sm:text-lg font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 text-base sm:text-lg font-semibold">
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </button>
              </div>
            </form>

            {/* Password Change Section */}
            <div className="mt-6 border-t pt-6">
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="w-full flex items-center justify-between text-left px-4 py-3 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl hover:from-cyan-100 hover:to-teal-100 transition"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="font-semibold text-gray-700">Change Password</span>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${showPasswordSection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showPasswordSection && (
                <form onSubmit={handleChangePassword} className="mt-4 space-y-4 bg-gray-50 p-4 rounded-xl">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="input-field"
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="input-field"
                      placeholder="Enter new password (min 6 characters)"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="input-field"
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full">
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Update Password
                  </button>
                </form>
              )}
            </div>

            {/* Delete Account Section */}
            <div className="mt-6 border-t pt-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="font-bold text-red-900 mb-1">Danger Zone</h3>
                    <p className="text-sm text-red-700 mb-3">
                      Once you delete your account, there is no going back. All your data will be permanently deleted.
                    </p>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg"
                    >
                      <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete My Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
