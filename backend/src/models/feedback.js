const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: String,
  username: String,
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;

// routes/feedbackRoutes.js
const express = require('express');
const router = express.Router();
const Feedback = require('../models/feedback');
const nodemailer = require('nodemailer');

// Configure email transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Submit feedback
router.post('/', async (req, res) => {
  try {
    const feedback = new Feedback(req.body);
    await feedback.save();

    // Send email notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Feedback Received',
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>Rating:</strong> ${req.body.rating}/5</p>
        <p><strong>User:</strong> ${req.body.username}</p>
        <p><strong>Feedback:</strong> ${req.body.feedback}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get feedback statistics for analytics
router.get('/stats', async (req, res) => {
  try {
    const [averageRating, totalFeedback, ratingDistribution] = await Promise.all([
      Feedback.aggregate([
        { $group: { _id: null, avg: { $avg: '$rating' } } }
      ]),
      Feedback.countDocuments(),
      Feedback.aggregate([
        { $group: { _id: '$rating', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      averageRating: averageRating[0]?.avg || 0,
      totalFeedback,
      ratingDistribution: ratingDistribution.reduce((acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Feedback stats error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback stats' });
  }
});

module.exports = router;