const express = require('express');
const router = express.Router();
const Feedback = require('../models/feedback');
const nodemailer = require('nodemailer');

// Timeout for email operations
const EMAIL_TIMEOUT = 5000;

// Configure email transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  // Set timeout options
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: EMAIL_TIMEOUT,
  socketTimeout: EMAIL_TIMEOUT
});

// Verify email configuration on startup
transporter.verify(function(error, success) {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready');
  }
});

// Test email endpoint
router.post('/test-email', async (req, res) => {
  try {
    // Quick validation of email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !process.env.ADMIN_EMAIL) {
      throw new Error('Email configuration is incomplete');
    }

    // Test email configuration
    const testMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'Test Email',
      html: '<h2>This is a test email</h2><p>If you receive this, the email configuration is working correctly.</p>'
    };

    await transporter.sendMail(testMailOptions);
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: error.message 
    });
  }
});

// Submit feedback
router.post('/', async (req, res) => {
  try {
    const { userId, username, rating, feedback } = req.body;

    // Validate required fields
    if (!userId || !username || !rating) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'userId, username, and rating are required'
      });
    }

    // Create and save feedback
    const feedbackDoc = new Feedback({
      userId,
      username,
      rating,
      feedback
    });
    await feedbackDoc.save();

    // Send email notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Feedback Received',
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>Rating:</strong> ${rating}/5</p>
        <p><strong>User:</strong> ${username}</p>
        <p><strong>Feedback:</strong> ${feedback || 'No comments provided'}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `
    };

    // Send email with timeout
    await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email timeout')), EMAIL_TIMEOUT)
      )
    ]);

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Feedback submission error:', error);
    
    // Determine appropriate status code
    const statusCode = error.message.includes('validation failed') ? 400 : 500;
    
    res.status(statusCode).json({ 
      error: 'Failed to submit feedback',
      details: error.message 
    });
  }
});

module.exports = router;