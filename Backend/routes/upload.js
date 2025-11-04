const express = require('express');
const multer = require('multer');
const path = require('path');
const Image = require('../models/Image');
const { uploadBuffer } = require('../services/gcs');

const router = express.Router();

// Configure multer to use memory storage (we'll upload directly to GCS)
const storage = multer.memoryStorage();

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Upload image endpoint
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Generate short encrypted ID
    let shortId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      shortId = Image.generateShortId();
      const existing = await Image.findOne({ shortId });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate unique image ID' });
    }

    // Generate unique filename for GCS
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(req.file.originalname);
    const gcsFileName = `images/image-${uniqueSuffix}${ext}`;

    // Upload to Google Cloud Storage
    const gcsUrl = await uploadBuffer(
      req.file.buffer,
      gcsFileName,
      req.file.mimetype
    );

    // Save image mapping to database with GCS URL
    const imageDoc = new Image({
      shortId,
      filePath: gcsUrl, // Store GCS URL in filePath for backward compatibility
      gcsUrl: gcsUrl,   // Store explicit GCS URL
      filename: req.file.originalname,
      gcsFileName: gcsFileName, // Store GCS file name for deletion if needed
      mimeType: req.file.mimetype,
      fileSize: req.file.size
    });

    await imageDoc.save();

    // Log the generated URL for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Image Upload] Uploaded to GCS: ${gcsUrl}`);
    }
    
    res.status(200).json({
      success: true,
      imageUrl: gcsUrl,
      shortId: shortId
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image: ' + error.message });
  }
});

module.exports = router;

