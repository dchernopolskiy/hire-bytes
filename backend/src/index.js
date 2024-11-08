require('isomorphic-fetch');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// In-memory storage
const activeRooms = new Map();
const feedbackStore = new Map();
const analyticsEvents = [];

// Analytics tracking function
const trackAnalytics = (eventName, properties = {}) => {
  const event = {
    id: uuidv4(),
    eventName,
    timestamp: new Date(),
    properties,
    origin: 'server'
  };
  
  analyticsEvents.push(event);
  console.log(`Analytics event tracked: ${eventName}`, properties);
  
  // Keep only last 1000 events to prevent memory issues
  if (analyticsEvents.length > 1000) {
    analyticsEvents.shift();
  }
  
  return event;
};

// Initialize Socket.IO with CORS options
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://hirebytes.netlify.app',
  'https://hire-bytes.pro',
  'http://hire-bytes.pro'
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Set up CORS for Express
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Analytics Dashboard endpoint
app.get('/api/analytics/dashboard', (req, res) => {
  try {
    const { range = '7d' } = req.query;
    const end = new Date();
    const start = new Date();
    
    switch (range) {
      case '24h':
        start.setHours(start.getHours() - 24);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }

    const filteredEvents = analyticsEvents.filter(
      event => event.timestamp >= start && event.timestamp <= end
    );

    // Calculate overview stats
    const totalRooms = activeRooms.size;
    const activeUsers = new Set([...activeRooms.values()]
      .flatMap(room => room.participants.map(p => p.userId))).size;

    const totalAnalyses = filteredEvents.filter(
      event => event.eventName === 'code_analyzed'
    ).length;

    // Calculate daily trends
    const trends = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const date = d.toISOString().split('T')[0];
      const dayEvents = filteredEvents.filter(
        event => event.timestamp.toISOString().startsWith(date)
      );
      trends.push({
        date,
        rooms: dayEvents.filter(e => e.eventName === 'room_created').length
      });
    }

    // Calculate language distribution
    const languages = Object.entries(
      filteredEvents
        .filter(e => e.properties.language)
        .reduce((acc, event) => {
          const lang = event.properties.language;
          acc[lang] = (acc[lang] || 0) + 1;
          return acc;
        }, {})
    ).map(([name, value]) => ({ name, value }));

    // Calculate daily activity
    const dailyActivity = trends.map(({ date, rooms }) => ({
      date,
      sessions: rooms
    }));

    // Get recent activity
    const recentActivity = filteredEvents
      .slice(-10)
      .reverse()
      .map(event => ({
        id: event.id,
        type: event.eventName,
        userId: event.properties.userId,
        username: event.properties.username,
        timestamp: event.timestamp
      }));

    res.json({
      overview: {
        totalRooms,
        activeUsers,
        averageSessionDuration: 0, // Placeholder since we're not tracking session duration
        totalCodeAnalyses: totalAnalyses
      },
      trends,
      languages,
      dailyActivity,
      recentActivity
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Room creation endpoint
app.post('/api/rooms', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const roomId = uuidv4();
    const userId = uuidv4();

    // Create room in memory
    activeRooms.set(roomId, {
      roomId,
      creatorId: userId,
      content: '// Start coding here',
      language: 'javascript',
      participants: [{
        userId,
        username,
        joinedAt: new Date()
      }],
      created: new Date()
    });

    // Track analytics
    trackAnalytics('room_created', {
      roomId,
      userId,
      username
    });

    res.status(201).json({
      roomId,
      userId,
      username
    });
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Feedback endpoint
app.post('/api/feedback', async (req, res) => {
  try {
    const { userId, username, rating, feedback } = req.body;

    if (!userId || !username || !rating) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    // Store feedback in memory
    const feedbackId = uuidv4();
    feedbackStore.set(feedbackId, {
      id: feedbackId,
      userId,
      username,
      rating,
      feedback,
      timestamp: new Date()
    });

    // Track analytics
    trackAnalytics('feedback_submitted', {
      userId,
      username,
      rating
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Code analysis endpoint
app.post('/api/analyze', async (req, res) => {
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      As a technical interviewer, analyze the following ${language} code. Consider:
      1. Code style and best practices
      2. Potential bugs or issues
      3. Time and space complexity (if applicable)
      4. Suggestions for improvement
      
      Code to analyze:
      \`\`\`${language}
      ${code}
      \`\`\`
      
      Provide a concise, bullet-point analysis focusing on the most important aspects.
    `;

    const result = await model.generateContent(prompt);
    const analysis = result.response.text();
    
    // Track analytics
    trackAnalytics('code_analyzed', {
      language,
      codeLength: code.length
    });

    res.json({ analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_room', ({ roomId, userId, username, isCreator }) => {
    const room = activeRooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Store user info in socket for later use
    socket.userId = userId;
    socket.username = username;
    socket.currentRoom = roomId;

    // Clean up any existing entries for this user
    room.participants = room.participants.filter(p => p.userId !== userId);

    // Add user to room participants
    room.participants.push({
      userId,
      username,
      joinedAt: new Date()
    });
      
    // Track analytics
    trackAnalytics('user_joined', {
      roomId,
      userId,
      username,
      isCreator
    });

    socket.join(roomId);
    socket.to(roomId).emit('user_joined', { userId, username });
    
    // Send current room state to joining user
    socket.emit('room_state', {
      code: room.content,
      language: room.language,
      participants: room.participants
    });
  });

  socket.on('code_change', ({ roomId, code }) => {
    const room = activeRooms.get(roomId);
    if (room) {
      room.content = code;
      socket.to(roomId).emit('receive_code', code);
      
      // Track analytics with username
      if (Math.random() < 0.1) { // Only track ~10% of code changes
        trackAnalytics('code_changed', {
          roomId,
          userId: socket.userId,
          username: socket.username,
          codeLength: code.length
        });
      }
    }
  });

  socket.on('language_change', ({ roomId, language }) => {
    const room = activeRooms.get(roomId);
    if (room) {
      room.language = language;
      socket.to(roomId).emit('language_changed', language);
      
      // Track analytics
      trackAnalytics('language_changed', {
        roomId,
        language,
        userId: socket.userId,
        username: socket.username
      });
    }
  });

  socket.on('cursor_move', ({ roomId, userId, username, position }) => {
    socket.to(roomId).emit('cursor_update', { userId, username, position });
  });

  socket.on('mute_user', ({ roomId, userId }) => {
    io.to(roomId).emit('user_muted', userId);
    // Track analytics
    trackAnalytics('user_muted', {
      roomId,
      mutedUserId: userId,
      byUserId: socket.userId,
      byUsername: socket.username
    });
  });

  socket.on('unmute_user', ({ roomId, userId }) => {
    io.to(roomId).emit('user_unmuted', userId);
    // Track analytics
    trackAnalytics('user_unmuted', {
      roomId,
      unmutedUserId: userId,
      byUserId: socket.userId,
      byUsername: socket.username
    });
  });

  socket.on('kick_user', ({ roomId, userId }) => {
    const room = activeRooms.get(roomId);
    if (room) {
      // Remove from room participants
      room.participants = room.participants.filter(p => p.userId !== userId);
      
      // Notify all clients in the room
      io.to(roomId).emit('kicked', userId);
      
      // Find and disconnect the kicked user's socket
      const userSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === userId);
      if (userSocket) {
        userSocket.disconnect(true);
      }

      // Track analytics
      trackAnalytics('user_kicked', {
        roomId,
        kickedUserId: userId,
        byUserId: socket.userId,
        byUsername: socket.username
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    if (socket.currentRoom) {
      const room = activeRooms.get(socket.currentRoom);
      if (room) {
        // Remove user from participants
        room.participants = room.participants.filter(p => p.userId !== socket.userId);
        
        // Notify others
        socket.to(socket.currentRoom).emit('user_left', socket.userId);
        
        // Track analytics
        trackAnalytics('user_left', {
          roomId: socket.currentRoom,
          userId: socket.userId,
          username: socket.username
        });

        // Remove room if empty
        if (room.participants.length === 0) {
          activeRooms.delete(socket.currentRoom);
        }
      }
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
    // Clean up user data if needed
    if (socket.currentRoom) {
      const room = activeRooms.get(socket.currentRoom);
      if (room) {
        room.participants = room.participants.filter(p => p.userId !== socket.userId);
        if (room.participants.length === 0) {
          activeRooms.delete(socket.currentRoom);
        }
      }
    }
  });
});

// Keepalive endpoint
app.get('/keepalive', (_, res) => res.sendStatus(200));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('- GET  /keepalive');
  console.log('- GET  /api/analytics/dashboard');
  console.log('- POST /api/rooms');
  console.log('- POST /api/feedback');
  console.log('- POST /api/analyze');
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});