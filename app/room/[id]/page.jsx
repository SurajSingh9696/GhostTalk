'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { io } from 'socket.io-client'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { getUserFriendlyError, logError } from '@/lib/utils/errorHandler'

export default function RoomPage() {
  const router = useRouter()
  const params = useParams()
  const roomId = params.id

  const [user, setUser] = useState(null)
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState(null)
  const [showParticipants, setShowParticipants] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [error, setError] = useState('')
  const [socketInitialized, setSocketInitialized] = useState(false)
  const [isRoomDeleted, setIsRoomDeleted] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [useHttpFallback, setUseHttpFallback] = useState(false)
  const [isPolling, setIsPolling] = useState(false)

  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)
  const isDeletingRoomRef = useRef(false)
  const pollingIntervalRef = useRef(null)
  const lastMessageTimestampRef = useRef(null)

  useEffect(() => {
    checkAuthAndJoinRoom()
    
    // Cleanup function
    return () => {
      if (socket) {
        console.log('Cleaning up socket connection')
        socket.removeAllListeners()
        socket.disconnect()
        setSocket(null)
        setSocketInitialized(false)
      }
      // Clear polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [roomId]) // Only re-run if roomId changes

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const checkAuthAndJoinRoom = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/auth/login')
        return
      }
      const data = await response.json()
      setUser(data.user)

      // Verify room exists
      const roomResponse = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      })

      const roomData = await roomResponse.json()

      if (!roomResponse.ok) {
        // Handle different error cases
        if (roomResponse.status === 401) {
          router.push('/auth/login')
          return
        }
        
        // For 404 or other errors, show toast but continue to socket
        // Socket will do the final validation and handle accordingly
        if (roomResponse.status === 404) {
          console.log('Room not found via API, checking via socket...')
        } else {
          toast.error(getUserFriendlyError(roomData.error || 'Failed to join room'))
        }
      } else {
        // Set room data if API call succeeded
        setRoom(roomData.room)
        setParticipants(roomData.room.participants)
      }

      // Always initialize Socket.io - it will validate the room
      initializeSocket(data.user)
    } catch (error) {
      console.error('Error joining room:', error)
      // Only redirect if it's an auth error, otherwise show error message
      if (error.message?.includes('Unauthorized') || error.message?.includes('auth')) {
        router.push('/auth/login')
      } else {
        setError('Failed to connect to room. Please try refreshing the page.')
        setLoading(false)
      }
    } finally {
      if (!error) {
        setLoading(false)
      }
    }
  }

  const initializeSocket = (userData) => {
    // Prevent duplicate socket connections
    if (socket || socketInitialized) {
      console.log('Socket already initialized')
      return
    }

    setSocketInitialized(true)

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
    console.log('Attempting to connect to Socket.IO at:', socketUrl)
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    })

    // Set a timeout to switch to HTTP fallback if socket doesn't connect
    const connectionTimeout = setTimeout(() => {
      if (!newSocket.connected) {
        console.log('Socket connection timeout - switching to HTTP fallback')
        newSocket.disconnect()
        setSocketInitialized(false)
        setUseHttpFallback(true)
        startHttpPolling(userData)
      }
    }, 10000) // 10 second timeout

    newSocket.on('connect', () => {
      clearTimeout(connectionTimeout)
      console.log('Socket connected:', newSocket.id)
      setUseHttpFallback(false)
      newSocket.emit('join-room', {
        roomId,
        userId: userData.id,
        userName: userData.name,
      })
      console.log(`Emitted join-room for room: ${roomId}`)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      clearTimeout(connectionTimeout)
      // Switch to HTTP fallback
      console.log('Switching to HTTP fallback due to connection error')
      newSocket.disconnect()
      setSocketInitialized(false)
      setUseHttpFallback(true)
      startHttpPolling(userData)
    })

    // Use .once() for initial messages to prevent duplicates
    newSocket.once('room-messages', (msgs) => {
      setMessages(msgs)
      if (msgs.length > 0) {
        lastMessageTimestampRef.current = msgs[msgs.length - 1].timestamp
      }
    })

    newSocket.on('new-message', (message) => {
      setMessages((prev) => {
        // Prevent duplicate messages by checking if message already exists
        const exists = prev.some(m => m._id === message._id)
        if (exists) return prev
        const newMessages = [...prev, message]
        lastMessageTimestampRef.current = message.timestamp
        return newMessages
      })
    })

    newSocket.on('new-media', (message) => {
      setMessages((prev) => {
        // Prevent duplicate messages
        const exists = prev.some(m => m._id === message._id)
        if (exists) return prev
        const newMessages = [...prev, message]
        lastMessageTimestampRef.current = message.timestamp
        return newMessages
      })
    })

    newSocket.on('participants-update', (updatedParticipants) => {
      setParticipants(updatedParticipants)
    })

    newSocket.on('user-joined', ({ userName }) => {
      // Optional: Show notification
      console.log(`${userName} joined the room`)
    })

    newSocket.on('user-typing', ({ userName, isTyping }) => {
      // Don't show typing indicator for current user
      if (userName === userData.name) return
      
      if (isTyping) {
        setTypingUsers((prev) => [...new Set([...prev, userName])])
      } else {
        setTypingUsers((prev) => prev.filter((name) => name !== userName))
      }
    })

    newSocket.on('room-deleted', ({ message }) => {
      console.log('Room deleted event received, isDeletingRoom:', isDeletingRoomRef.current)
      
      setIsRoomDeleted(true)
      
      // Add system message to chat
      const systemMessage = {
        _id: 'system-' + Date.now(),
        type: 'system',
        message: '🚫 Room has been deleted by admin',
        timestamp: new Date(),
        isSystem: true,
      }
      setMessages((prev) => [...prev, systemMessage])
      
      // Skip notification if this user initiated the deletion (admin)
      if (isDeletingRoomRef.current) {
        console.log('Skipping notification - this user deleted the room')
        return
      }
      
      // Show toast and redirect for participants only
      toast.error('This room has been deleted by the admin. Redirecting...', { duration: 3000 })
      
      // Redirect participants after 3 seconds
      setTimeout(() => {
        if (newSocket) {
          newSocket.emit('leave-room', { roomId, userId: userData.id })
          newSocket.disconnect()
        }
        router.push('/dashboard')
      }, 3000)
    })

    newSocket.on('error', ({ message }) => {
      console.error('Socket error:', message)
      
      // Handle room not found error
      if (message?.toLowerCase().includes('room not found') || message?.toLowerCase().includes('not found')) {
        toast.error('Room not found or has been deleted')
        setLoading(false)
        
        // Disconnect socket and redirect to dashboard
        newSocket.disconnect()
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
        return
      }
      
      // Handle other errors
      toast.error(getUserFriendlyError(message))
      setError(message)
    })

    setSocket(newSocket)
  }

  // HTTP Fallback: Start polling for new messages
  const startHttpPolling = async (userData) => {
    if (isPolling || pollingIntervalRef.current) {
      console.log('Polling already active')
      return
    }

    console.log('Starting HTTP polling for messages')
    setIsPolling(true)

    // Initial fetch
    await fetchMessages()

    // Poll every 2 seconds
    pollingIntervalRef.current = setInterval(async () => {
      await fetchMessages()
    }, 2000)
  }

  // Fetch messages via HTTP API
  const fetchMessages = async () => {
    try {
      const url = new URL('/api/messages', window.location.origin)
      url.searchParams.append('roomId', roomId)
      if (lastMessageTimestampRef.current) {
        url.searchParams.append('after', lastMessageTimestampRef.current)
      }

      const response = await fetch(url)
      if (!response.ok) {
        if (response.status === 404) {
          // Room not found or deleted
          setIsRoomDeleted(true)
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
          toast.error('Room not found or has been deleted')
          setTimeout(() => router.push('/dashboard'), 2000)
          return
        }
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      
      if (data.roomDeleted) {
        setIsRoomDeleted(true)
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
        toast.error('This room has been deleted')
        setTimeout(() => router.push('/dashboard'), 2000)
        return
      }

      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => {
          // Merge new messages, avoiding duplicates
          const newMessages = [...prev]
          data.messages.forEach(msg => {
            if (!newMessages.some(m => m._id === msg._id)) {
              newMessages.push(msg)
            }
          })
          // Update last timestamp
          const lastMsg = data.messages[data.messages.length - 1]
          lastMessageTimestampRef.current = lastMsg.timestamp
          return newMessages
        })
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!newMessage.trim() || isRoomDeleted) return

    // Try Socket.IO first
    if (socket && socket.connected && !useHttpFallback) {
      socket.emit('send-message', {
        roomId,
        userId: user.id,
        userName: user.name,
        message: newMessage.trim(),
      })

      setNewMessage('')

      // Stop typing indicator
      socket.emit('typing', { roomId, userName: user.name, isTyping: false })
    } else {
      // Fallback to HTTP API
      try {
        const response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            message: newMessage.trim(),
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send message')
        }

        // Add message to local state immediately
        setMessages((prev) => {
          // Check if message already exists (in case of fast polling)
          if (prev.some(m => m._id === data.message._id)) {
            return prev
          }
          lastMessageTimestampRef.current = data.message.timestamp
          return [...prev, data.message]
        })

        setNewMessage('')
      } catch (error) {
        logError('Send Message', error)
        toast.error(getUserFriendlyError(error, 'Failed to send message'))
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)

    if (!socket || !socket.connected || useHttpFallback) return

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Send typing indicator (only works with Socket.IO)
    socket.emit('typing', { roomId, userName: user.name, isTyping: true })

    // Stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { roomId, userName: user.name, isTyping: false })
    }, 1000)
  }

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', { roomId, userId: user.id })
      socket.disconnect()
    }
    router.push('/dashboard')
  }

  const handleDeleteRoom = async () => {
    if (!confirm('Are you sure you want to delete this room? All messages will be lost.')) {
      return
    }

    // Set flag to indicate this user is deleting the room
    isDeletingRoomRef.current = true

    const deleteToast = toast.loading('Deleting room...')
    try {
      const response = await fetch('/api/rooms/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete room')
      }

      toast.success('Room deleted successfully', { id: deleteToast })
      
      // Admin is immediately redirected
      // Participants will receive socket event
      router.push('/dashboard')
    } catch (error) {
      logError('Delete Room', error)
      toast.error(getUserFriendlyError(error, 'Failed to delete room'), { id: deleteToast })
    }
  }

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId)
    toast.success('Room ID copied to clipboard!')
  }

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Only images and videos are supported')
      return
    }

    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB')
      return
    }

    const uploadToast = toast.loading('Uploading media...')
    try {
      setUploadingMedia(true)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('roomId', roomId)

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload media')
      }

      // Emit media message via socket
      if (socket) {
        socket.emit('send-media', {
          roomId,
          userId: user.id,
          userName: user.name,
          mediaId: data.mediaId,
          messageId: data.messageId,
          fileName: data.fileName,
          mimeType: data.mimeType,
          fileSize: data.fileSize,
        })
      }
      toast.success('Media uploaded successfully!', { id: uploadToast })
    } catch (error) {
      logError('Media Upload', error)
      toast.error(getUserFriendlyError(error, 'Failed to upload media'), { id: uploadToast })
    } finally {
      setUploadingMedia(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDownloadMedia = async (mediaId, fileName) => {
    const downloadToast = toast.loading('Downloading media...')
    try {
      const response = await fetch(`/api/media/${mediaId}`)
      if (!response.ok) throw new Error('Failed to download media')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Media downloaded successfully!', { id: downloadToast })
    } catch (error) {
      logError('Download Media', error)
      toast.error('Failed to download media', { id: downloadToast })
    }
  }

  const isAdmin = user && room && user.id === room.adminId

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl font-bold text-primary">Loading room...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-light">
      {/* Header */}
      <header className="bg-primary text-white shadow-md">
        <div className="px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button
              onClick={handleLeaveRoom}
              className="hover:bg-secondary rounded-full p-1.5 sm:p-2 transition flex-shrink-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-lg font-bold truncate">Room: {roomId}</h1>
                {useHttpFallback && (
                  <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    HTTP Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-white/80">{participants.length} participants</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={copyRoomId}
              className="hover:bg-secondary rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm transition"
            >
              <span className="hidden sm:inline">Copy ID</span>
              <span className="sm:hidden">Copy</span>
            </button>
            <button
              onClick={() => setShowParticipants(true)}
              className="hover:bg-secondary rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm transition"
            >
              <span className="hidden sm:inline">Participants</span>
              <span className="sm:hidden">👥</span>
            </button>
            {isAdmin && (
              <button
                onClick={handleDeleteRoom}
                className="hover:bg-red-600 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm transition"
              >
                <span className="hidden sm:inline">Delete Room</span>
                <span className="sm:hidden">🗑️</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => {
            // Render system messages (like room deleted)
            if (msg.isSystem || msg.type === 'system') {
              return (
                <div key={msg._id || `system-${msg.timestamp}-${index}`} className="flex justify-center my-4">
                  <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                    {msg.message}
                  </div>
                </div>
              )
            }
            
            const isOwnMessage = msg.senderId === user?.id
            const participant = participants.find(p => p.id === msg.senderId)
            const avatar = participant?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName}`
            const isMediaMessage = msg.type === 'media' && msg.mediaId
            
            return (
              <div
                key={msg._id}
                className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fadeInUp`}
              >
                {!isOwnMessage && (
                  <img
                    src={avatar}
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md flex-shrink-0"
                  />
                )}
                <div className={`max-w-[70%] sm:max-w-md`}>
                  {!isOwnMessage && (
                    <div className="text-xs text-gray-600 mb-1 ml-2 font-medium">{msg.senderName}</div>
                  )}
                  
                  {isMediaMessage ? (
                    <div
                      className={`message-bubble ${
                        isOwnMessage ? 'message-sent' : 'message-received'
                      } p-0 overflow-hidden`}
                    >
                      <div 
                        className="relative group cursor-pointer"
                        onClick={() => handleDownloadMedia(msg.mediaId, msg.fileName || 'media')}
                      >
                        {/* Blurred Thumbnail */}
                        <img
                          src={`/api/media/thumbnail/${msg.mediaId}`}
                          alt="Media"
                          className="w-full h-48 object-cover"
                        />
                        
                        {/* Download Icon Overlay */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition">
                          <div className="bg-white/90 rounded-full p-4 group-hover:scale-110 transition">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="px-3 py-2">
                        <div
                          className={`text-xs ${
                            isOwnMessage ? 'text-white/70' : 'text-gray-500'
                          }`}
                        >
                          {format(new Date(msg.timestamp), 'HH:mm')}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`message-bubble ${
                        isOwnMessage ? 'message-sent' : 'message-received'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      <div
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-white/70' : 'text-gray-500'
                        }`}
                      >
                        {format(new Date(msg.timestamp), 'HH:mm')}
                      </div>
                    </div>
                  )}
                </div>
                {isOwnMessage && (
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                    alt="You"
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md flex-shrink-0"
                  />
                )}
              </div>
            )
          })
        )}
        {typingUsers.length > 0 && !isRoomDeleted && !useHttpFallback && (
          <div className="text-sm text-gray-500 italic ml-2">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-3 sm:px-4 py-3 relative">
        {isRoomDeleted ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-center">
            <p className="font-medium text-sm sm:text-base">🚫 This room has been deleted</p>
            <p className="text-xs sm:text-sm mt-1">No further messages can be sent. Redirecting to dashboard...</p>
          </div>
        ) : (
          <>
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 animate-fadeInUp z-10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Emojis</h4>
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-8 gap-2 max-w-xs">
                  {['😀', '😂', '🥰', '😎', '🤔', '😊', '👍', '❤️', '🎉', '🔥', '✨', '💯', '🙌', '👏', '🤝', '🎊', '😍', '🤩', '😇', '🥳', '😋', '😜', '🤗', '🤭', '🙏', '💪', '👌', '✌️', '🤞', '🎯', '⭐', '🌟'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setNewMessage(prev => prev + emoji)
                        setShowEmojiPicker(false)
                      }}
                      className="text-2xl hover:bg-gray-100 rounded-lg p-1 transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="hidden"
              />
              
              {/* Media Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia || isRoomDeleted}
                className="text-gray-500 hover:text-purple-600 transition p-2 hover:bg-gray-100 rounded-full flex-shrink-0 mb-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingMedia ? (
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-gray-500 hover:text-gray-700 transition p-2 hover:bg-gray-100 rounded-full flex-shrink-0 mb-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <textarea
                value={newMessage}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none max-h-32 overflow-y-auto scrollbar-hide"
                disabled={isRoomDeleted}
                style={{
                  minHeight: '42px',
                  height: 'auto',
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
                }}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isRoomDeleted}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white p-2.5 sm:p-3 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-lg hover:shadow-xl mb-1"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>

      {/* Participants Modal */}
      {showParticipants && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Participants</h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      {participant.name}
                      {participant.isAdmin && (
                        <span className="ml-2 text-xs bg-accent text-white px-2 py-1 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Room Deleted Modal */}
      {isRoomDeleted && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Room Deleted</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-2">
              This room has been deleted by the admin.
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mb-6">
              You will be redirected to the dashboard shortly...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

