const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    // For now, just log the feedback
    console.log('Received feedback:', req.body);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

module.exports = router;