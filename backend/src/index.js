require('isomorphic-fetch');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const { trackAnalytics } = require('./routes/analyticsService');
const Room = require('./models/room');
const exerciseRoutes = require('./routes/exerciseRoutes');
require('dotenv').config();

// Import routes
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

// Initialize Express and Socket.IO
const app = express();
const server = http.createServer(app);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Room management functions
async function createRoom(roomId, userId, username) {
  const room = new Room({
    roomId,
    creatorId: userId,
    content: '// Start coding here',
    language: 'javascript',
    participants: [{
      userId,
      username,
      joinedAt: new Date()
    }],
    lastActive: new Date()
  });
  
  await room.save();
  return room;
}

async function getRoom(roomId) {
  const room = await Room.findOne({ roomId });
  if (room) {
    room.lastActive = new Date();
    await room.save();
  }
  return room;
}

async function updateRoom(roomId, updates) {
  return Room.findOneAndUpdate(
    { roomId },
    { ...updates, lastActive: new Date() },
    { new: true }
  );
}

async function cleanupEmptyRoom(roomId) {
  try {
    const room = await Room.findOne({ roomId });
    if (!room) return;

    // If the creator is still connected, don't cleanup
    const creator = room.participants.find(p => p.isCreator);
    if (creator && !creator.disconnectedAt) return;

    // Give a 5-minute grace period for reconnection
    const gracePeriod = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    
    // Check if all participants have been disconnected for longer than grace period
    const allDisconnected = room.participants.every(p => 
      p.disconnectedAt && (now - p.disconnectedAt.getTime() > gracePeriod)
    );

    if (allDisconnected) {
      await Room.deleteOne({ roomId });
      console.log(`Cleaned up abandoned room: ${roomId} 👋`);
      await trackAnalytics('room_cleaned', { 
        roomId,
        reason: 'abandoned',
        duration: now - room.created.getTime()
      });
    }
  } catch (error) {
    console.error('Room cleanup error:', error);
  }
}

async function periodicCleanup() {
  try {
    // Find rooms that haven't been active for 5 minutes and have no participants
    const threshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
    const emptyRooms = await Room.find({
      lastActive: { $lt: threshold },
      'participants.0': { $exists: false }
    });

    for (const room of emptyRooms) {
      await Room.deleteOne({ roomId: room.roomId });
      console.log(`Periodic cleanup: removed room ${room.roomId}`);
      await trackAnalytics('room_cleaned', { 
        roomId: room.roomId,
        reason: 'periodic'
      });
    }
  } catch (error) {
    console.error('Periodic cleanup error:', error);
  }
}

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://hirebytes.netlify.app',
  'https://hire-bytes.pro'
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Express middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/')
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Mount routes
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api', exerciseRoutes);

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
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

    const room = await createRoom(roomId, userId, username);
    
    await trackAnalytics('room_created', {
      roomId,
      userId,
      username
    });

    res.status(201).json({ roomId, userId, username });
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({ error: 'Failed to create room' });
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
      5. Follow up questions you would ask the candidate
      
      Code to analyze:
      \`\`\`${language}
      ${code}
      \`\`\`
      
      Provide a concise, bullet-point analysis focusing on the most important aspects. If the code doesn't make sense or is incomplete - please make sure to say that in the beginning.
    `;

    const result = await model.generateContent(prompt);
    const analysis = result.response.text();
    
    await trackAnalytics('code_analyzed', {
      language,
      codeLength: code.length
    });

    res.json({ analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Helpers for viewport and cursors
const roomCursors = new Map();
const roomViewports = new Map();

function getCursorPositions(roomId) {
  if (!roomCursors.has(roomId)) {
    roomCursors.set(roomId, new Map());
  }
  return roomCursors.get(roomId);
}

function getViewportPositions(roomId) {
  if (!roomViewports.has(roomId)) {
    roomViewports.set(roomId, new Map());
  }
  return roomViewports.get(roomId);
}

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_room', async ({ roomId, userId, username, isCreator }) => {
    try {
      const room = await getRoom(roomId);
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Check for existing participant
      const existingParticipant = room.participants.find(p => p.userId === userId);
      if (existingParticipant) {
        // They're reconnecting! Welcome back! 🎉
        existingParticipant.disconnectedAt = null;
        existingParticipant.socketId = socket.id;
        await room.save();
        
        socket.to(roomId).emit('user_reconnected', { 
          userId, 
          username,
          participant: existingParticipant 
        });
      } else {
        // New participant
        const newParticipant = {
          userId,
          username,
          isCreator,
          joinedAt: new Date(),
          socketId: socket.id
        };
        
        room.participants.push(newParticipant);
        await room.save();
        
        socket.to(roomId).emit('user_joined', { 
          userId, 
          username,
          participant: newParticipant 
        });
      }

      socket.to(roomId).emit('viewport_update', {
        userId,
        from: 0,
        to: 1000 // Default viewport size
      });

      // Set socket properties
      socket.userId = userId;
      socket.username = username;
      socket.currentRoom = roomId;

      // Join the room
      socket.join(roomId);

      // Send current room state
      socket.emit('room_state', {
        code: room.content,
        language: room.language,
        participants: room.participants.map(p => ({
          userId: p.userId,
          username: p.username,
          isCreator: p.isCreator,
          joinedAt: p.joinedAt,
          // Only send active participants
          isActive: !p.disconnectedAt
        })),
        cursors: Array.from(getCursorPositions(roomId).entries()).map(([uid, data]) => ({
          userId: uid,
          ...data
        })),
        viewports: Array.from(getViewportPositions(roomId).entries())
      });

      // Track analytics
      await trackAnalytics('user_joined', {
        roomId,
        userId,
        username,
        isCreator,
        isReconnection: !!existingParticipant,
        participantCount: room.participants.length
      });

    } catch (error) {
      console.error('Room join error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('code_change', async ({ roomId, code }) => {
    try {
      const room = await updateRoom(roomId, { content: code });
      if (room) {
        socket.to(roomId).emit('receive_code', code);
        
        if (Math.random() < 0.1) {
          await trackAnalytics('code_changed', {
            roomId,
            userId: socket.userId,
            username: socket.username,
            codeLength: code.length
          });
        }
      }
    } catch (error) {
      console.error('Code change error:', error);
    }
  });

  socket.on('language_change', async ({ roomId, language }) => {
    try {
      const room = await updateRoom(roomId, { language });
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      io.in(roomId).emit('language_changed', language);
      
      await trackAnalytics('language_changed', {
        roomId,
        language,
        userId: socket.userId,
        username: socket.username,
        previousLanguage: room.language
      });
    } catch (error) {
      console.error('Language change error:', error);
      socket.emit('error', { message: 'Failed to change language' });
    }
  });

  // Cursor focus
  socket.on('focus_change', ({ roomId, userId, username, status }) => {
    socket.to(roomId).emit('focus_change', { userId, status });
  });

  socket.on('cursor_move', ({ roomId, userId, username, position }) => {
    socket.to(roomId).emit('cursor_update', { userId, username, position });
  });

  socket.on('mute_user', async ({ roomId, userId }) => {
    io.to(roomId).emit('user_muted', userId);
    await trackAnalytics('user_muted', {
      roomId,
      mutedUserId: userId,
      byUserId: socket.userId,
      byUsername: socket.username
    });
  });

  socket.on('unmute_user', async ({ roomId, userId }) => {
    io.to(roomId).emit('user_unmuted', userId);
    await trackAnalytics('user_unmuted', {
      roomId,
      unmutedUserId: userId,
      byUserId: socket.userId,
      byUsername: socket.username
    });
  });

  socket.on('viewport_update', ({ roomId, userId, from, to }) => {
    // Forward viewport update to all other users in the room
    socket.to(roomId).emit('viewport_update', {
      userId,
      from,
      to
    });
  });
  
  socket.on('selection_update', ({ roomId, userId, ranges }) => {
    // Forward selection update to all other users in the room
    socket.to(roomId).emit('selection_update', {
      userId,
      ranges
    });
  });
  
  socket.on('cursor_activity', ({ roomId, userId, username, position, isTyping }) => {
    socket.to(roomId).emit('cursor_update', {
      userId,
      username,
      position,
      isTyping
    });
  });

  socket.on('kick_user', async ({ roomId, userId }) => {
    try {
      const room = await getRoom(roomId);
      if (room) {
        room.participants = room.participants.filter(p => p.userId !== userId);
        await room.save();
        
        io.to(roomId).emit('kicked', userId);
        
        const userSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.userId === userId);
        if (userSocket) {
          userSocket.disconnect(true);
        }

        await trackAnalytics('user_kicked', {
          roomId,
          kickedUserId: userId,
          byUserId: socket.userId,
          byUsername: socket.username
        });
      }
    } catch (error) {
      console.error('Kick user error:', error);
    }
  });

  socket.on('disconnect', async () => {
    if (socket.currentRoom) {
      try {
        const room = await Room.findOne({ roomId: socket.currentRoom });
        if (room) {
          // Mark participant as disconnected
          const participant = room.participants.find(p => p.socketId === socket.id);
          if (participant) {
            participant.disconnectedAt = new Date();
            await room.save();
  
            // Clear cursor and viewport data
            const cursors = getCursorPositions(socket.currentRoom);
            const viewports = getViewportPositions(socket.currentRoom);
            cursors.delete(participant.userId);
            viewports.delete(participant.userId);
            
            socket.to(socket.currentRoom).emit('user_disconnected', {
              userId: participant.userId,
              username: participant.username,
              temporary: true
            });
            
            await trackAnalytics('user_disconnected', {
              roomId: socket.currentRoom,
              userId: participant.userId,
              username: participant.username,
              participantCount: room.participants.filter(p => !p.disconnectedAt).length
            });
  
            // Schedule room cleanup if needed
            setTimeout(() => cleanupEmptyRoom(socket.currentRoom), 5 * 60 * 1000);
          }
        }
      } catch (error) {
        console.error('Disconnect error:', error);
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
let cleanupInterval;

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('- GET  /keepalive');
  console.log('- GET  /api/analytics/dashboard');
  console.log('- POST /api/rooms');
  console.log('- POST /api/feedback');
  console.log('- POST /api/analyze');
  // Start periodic cleanup
  cleanupInterval = setInterval(periodicCleanup, 60 * 60 * 1000); // Run every 60 minutes
});

// Add cleanup interval handling to the error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (cleanupInterval) clearInterval(cleanupInterval);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  if (cleanupInterval) clearInterval(cleanupInterval);
  process.exit(1);
});

// Also add a graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Performing graceful shutdown...');
  if (cleanupInterval) clearInterval(cleanupInterval);
  
  try {
    // Run one final cleanup
    await periodicCleanup();
    
    // Close MongoDB connection
    await mongoose.connection.close();
    
    // Close server
    server.close(() => {
      console.log('Server shut down complete');
      process.exit(0);
    });
  } catch (error) {
    console.error('Shutdown error:', error);
    process.exit(1);
  }
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