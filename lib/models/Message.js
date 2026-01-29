const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['text', 'media'],
    default: 'text',
  },
  mediaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
})

// Index for efficient room-based queries
MessageSchema.index({ roomId: 1, timestamp: 1 })

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema)
