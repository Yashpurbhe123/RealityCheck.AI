const express = require('express');
const fs = require('fs');
const Image = require('../models/Image');

const router = express.Router();

// Serve image by short ID
router.get('/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;
    
    // Validate shortId format (should be 12 characters alphanumeric)
    if (!shortId || shortId.length !== 12) {
      return res.status(400).json({ error: 'Invalid image ID format' });
    }
    
    const imageDoc = await Image.findOne({ shortId });
    
    if (!imageDoc) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // If image is stored in GCS, redirect to the public URL
    if (imageDoc.gcsUrl) {
      return res.redirect(301, imageDoc.gcsUrl);
    }

    // Fallback: serve from local file system (for backward compatibility with old images)
    if (!imageDoc.filePath) {
      return res.status(404).json({ error: 'Image file path not found' });
    }

    // Check if file exists locally
    if (!fs.existsSync(imageDoc.filePath)) {
      // File doesn't exist, remove from database
      await Image.deleteOne({ shortId });
      return res.status(404).json({ error: 'Image file not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', imageDoc.mimeType);
    res.setHeader('Content-Length', imageDoc.fileSize);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Stream the file
    const fileStream = fs.createReadStream(imageDoc.filePath);
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to serve image' });
      }
    });
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving image:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to serve image' });
    }
  }
});

module.exports = router;

