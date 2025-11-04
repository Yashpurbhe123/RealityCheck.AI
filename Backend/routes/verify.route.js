const express = require('express');
const verificationController = require('../controllers/verify.conntroller');

const router = express.Router();
router.post('/', async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    
    // Content or imageUrl is required
    if (!content && !imageUrl) {
      return res.status(400).json({ 
        error: 'Content or image is required for verification' 
      });
    }
    
    const response = await verificationController(content || '', imageUrl);

    if (response.error) {
      console.error('Verification error:', response.error);
      return res.status(500).json({ 
        error: 'Failed to verify tweet content',
        details: response.error
      });
    }
    
    res.status(200).json({ 'response': response });
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ 
      error: 'Internal server error during verification',
      details: error.message 
    });
  }
});

module.exports = router;