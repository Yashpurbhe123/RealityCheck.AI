const mongoose = require('mongoose');
const crypto = require('crypto');

const imageSchema = new mongoose.Schema({
  shortId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  filePath: {
    type: String,
    required: false // Now optional, can be local path or GCS URL
  },
  gcsUrl: {
    type: String,
    required: false // GCS public URL
  },
  gcsFileName: {
    type: String,
    required: false // File name in GCS bucket for deletion
  },
  filename: {
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
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 90 * 24 * 60 * 60 * 1000 // Auto-delete after 90 days (optional)
  }
}, {
  timestamps: true
});

// Index for better query performance
imageSchema.index({ shortId: 1 });
imageSchema.index({ createdAt: 1 });

// Generate short encrypted ID
imageSchema.statics.generateShortId = function() {
  // Generate a random 12-character base64 URL-safe string
  return crypto.randomBytes(9).toString('base64url').substring(0, 12);
};

module.exports = mongoose.model('Image', imageSchema);

