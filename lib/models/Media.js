const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  data: {
    type: Buffer,
    required: true
  },
  thumbnail: {
    type: Buffer
  },
  width: Number,
  height: Number,
  compressed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
mediaSchema.index({ roomId: 1, createdAt: -1 });

const Media = mongoose.models.Media || mongoose.model('Media', mediaSchema);

module.exports = Media;
