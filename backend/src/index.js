require('isomorphic-fetch');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const Room = require('./models/room');
const User = require('./models/user');

console.log('Starting server initialization...');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS options
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Middleware setup
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

socket.on('join_room', async ({ roomId, userId, username, isCreator }) => {
  try {
    let room = await Room.findOne({ roomId });
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Check for existing user with same username
    const existingUser = room.participants.find(p => 
      p.username.toLowerCase() === username.toLowerCase() && p.userId !== userId
    );
    
    if (existingUser) {
      // Append number to username if it exists
      let counter = 1;
      let newUsername = username;
      while (room.participants.some(p => p.username.toLowerCase() === newUsername.toLowerCase())) {
        newUsername = `${username} (${counter})`;
        counter++;
      }
      username = newUsername;
    }

    // Update participant
    const participantIndex = room.participants.findIndex(p => p.userId === userId);
    if (participantIndex === -1) {
      room.participants.push({
        userId,
        username,
        joinedAt: new Date()
      });
    } else {
      room.participants[participantIndex].username = username;
      room.participants[participantIndex].joinedAt = new Date();
    }
    
    await room.save();

    // Join the Socket.IO room
    socket.join(roomId);
    
    // Notify others in the room
    socket.to(roomId).emit('user_joined', { userId, username });
    
    // Send current room state to the joining user
    socket.emit('room_state', {
      code: room.content,
      language: room.language,
      participants: room.participants
    });

  } catch (error) {
    console.error('Error joining room:', error);
    socket.emit('error', { message: 'Failed to join room' });
  }
});


  socket.on('code_change', async ({ roomId, code }) => {
    try {
      await Room.findOneAndUpdate(
        { roomId },
        { 
          content: code,
          lastActive: new Date()
        }
      );
      socket.to(roomId).emit('receive_code', code);
    } catch (error) {
      console.error('Error updating code:', error);
    }
  });

  socket.on('cursor_move', ({ roomId, userId, username, position }) => {
    console.log('Cursor moved:', { userId, username, position });
    socket.to(roomId).emit('cursor_update', { userId, username, position });
  });

  socket.on('mute_user', ({ roomId, userId }) => {
    console.log('Muting user:', userId);
    io.to(roomId).emit('user_muted', userId);
  });

  socket.on('unmute_user', ({ roomId, userId }) => {
    console.log('Unmuting user:', userId);
    io.to(roomId).emit('user_unmuted', userId);
  });

  socket.on('kick_user', async ({ roomId, userId }) => {
    console.log('Kicking user:', userId);
      await Room.findOneAndUpdate(
      { roomId },
      { $pull: { participants: { userId } } }
    );
    
    io.to(roomId).emit('kicked', userId);

    const userSocket = Array.from(io.sockets.sockets.values())
      .find(s => s.userId === userId);
    if (userSocket) {
      userSocket.disconnect(true);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id, socket.userId);
    // Notify rooms this user was in
    if (socket.userId) {
      socket.rooms.forEach(roomId => {
        if (roomId !== socket.id) { // socket.id is also in rooms
          socket.to(roomId).emit('user_left', socket.userId);
        }
      });
    }
  });
});

// API Endpoints
app.post('/api/rooms', async (req, res) => {
  console.log('Creating new room:', req.body);
  
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const roomId = uuidv4();
    const userId = uuidv4();

    // Create or update user
    let user = await User.findOne({ username });
    
    if (!user) {
      user = new User({
        userId,
        username,
        createdRooms: [roomId]
      });
    } else {
      user.createdRooms.push(roomId);
    }
    
    await user.save();

    // Create room
    const room = new Room({
      roomId,
      creatorId: user.userId,
      participants: [{
        userId: user.userId,
        username: user.username,
        joinedAt: new Date()
      }],
      created: new Date()
    });

    await room.save();

    res.status(201).json({
      roomId,
      userId: user.userId,
      username: user.username,
      creatorId: user.userId
    });

  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create room',
      details: error.message 
    });
  }
});

app.post('/api/analyze', async (req, res) => {
  console.log('\n=== Starting Code Analysis ===');
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    console.log('Initializing Gemini model...');
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ],
    });

    const analysisPrompt = `
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

    console.log('Sending request to Gemini API...');
    const result = await model.generateContent(analysisPrompt);
    console.log('Response received from Gemini API');

    if (!result.response) {
      throw new Error('No response from Gemini API');
    }

    const analysis = result.response.text();
    console.log('Analysis complete');

    res.json({ analysis });

  } catch (error) {
    console.error('Analysis error:', error);

    // Handle specific error cases
    if (error.message?.includes('quota') || error.message?.includes('rate')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please wait a moment before trying again.',
        retryAfter: 60
      });
    }

    if (error.message?.includes('safety')) {
      return res.status(400).json({
        error: 'Content filtered',
        message: 'The code analysis was blocked by safety filters. Please try different code.'
      });
    }

    res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    socketio: io ? 'initialized' : 'not initialized'
  });
});

// Connect to MongoDB and start server
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-collab', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB connected successfully');
  
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Full server initialization complete');
  });
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});