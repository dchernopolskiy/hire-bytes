const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  socketId: String,
  joinedAt: {
    type: Date,
    default: Date.now
  },
  isCreator: {
    type: Boolean,
    default: false
  },
  disconnectedAt: {
    type: Date,
    default: null
  },
  // New fields for better analytics
  totalConnectedTime: {
    type: Number,
    default: 0  // Track cumulative time in milliseconds
  },
  reconnections: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  contributions: {
    codeChanges: {
      type: Number,
      default: 0
    },
    selections: {
      type: Number,
      default: 0
    },
    executions: {
      type: Number,
      default: 0
    }
  }
});

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: [true, 'Room ID is required'],
    unique: true,
  },
  creatorId: {
    type: String,
    required: [true, 'Creator ID is required'],
  },
  created: {
    type: Date,
    default: Date.now,
    expires: 1800 // 30 minutes inactivity
  },
  participants: [participantSchema],
  content: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'javascript'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // New fields for analytics
  sessionMetrics: {
    maxConcurrentUsers: {
      type: Number,
      default: 1
    },
    totalCodeChanges: {
      type: Number,
      default: 0
    },
    totalExecutions: {
      type: Number,
      default: 0
    },
    languageChanges: [{
      from: String,
      to: String,
      timestamp: Date
    }],
    codeAnalyses: {
      type: Number,
      default: 0
    }
  },
  // Track code size over time
  codeMetrics: {
    history: [{
      timestamp: Date,
      size: Number,
      language: String
    }],
    peakSize: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  collection: 'rooms'
});

// Existing indexes
roomSchema.index({ roomId: 1 }, { unique: true });
roomSchema.index({ creatorId: 1 });
roomSchema.index({ 'participants.userId': 1 });
roomSchema.index({ lastActive: 1 }, { expireAfterSeconds: 1800 });

// New indexes for analytics
roomSchema.index({ 'sessionMetrics.maxConcurrentUsers': -1 });
roomSchema.index({ 'participants.totalConnectedTime': -1 });
roomSchema.index({ 'participants.contributions.codeChanges': -1 });

// Enhanced methods
roomSchema.methods.updateActivity = async function() {
  this.lastActive = new Date();
  return this.save();
};

roomSchema.methods.addParticipant = async function(userId, username, socketId) {
  const existingParticipant = this.participants.find(p => p.userId === userId);
  
  if (!existingParticipant) {
    this.participants.push({
      userId,
      username,
      socketId,
      joinedAt: new Date()
    });
    
    // Update max concurrent users if needed
    const activeParticipants = this.participants.filter(p => !p.disconnectedAt);
    if (activeParticipants.length > this.sessionMetrics.maxConcurrentUsers) {
      this.sessionMetrics.maxConcurrentUsers = activeParticipants.length;
    }
  } else {
    existingParticipant.socketId = socketId;
    existingParticipant.disconnectedAt = null;
    existingParticipant.reconnections += 1;
    existingParticipant.lastActive = new Date();
  }
  
  await this.save();
  return this;
};

roomSchema.methods.recordCodeChange = async function(userId, newContent) {
  const participant = this.participants.find(p => p.userId === userId);
  if (participant) {
    participant.contributions.codeChanges += 1;
    participant.lastActive = new Date();
  }

  this.sessionMetrics.totalCodeChanges += 1;
  
  // Track code metrics
  const currentSize = newContent.length;
  this.codeMetrics.history.push({
    timestamp: new Date(),
    size: currentSize,
    language: this.language
  });
  
  if (currentSize > this.codeMetrics.peakSize) {
    this.codeMetrics.peakSize = currentSize;
  }
  
  this.content = newContent;
  return this.save();
};

roomSchema.methods.updateParticipantDisconnection = async function(userId) {
  const participant = this.participants.find(p => p.userId === userId);
  if (participant) {
    const now = new Date();
    participant.disconnectedAt = now;
    
    // Update total connected time
    if (participant.lastActive) {
      participant.totalConnectedTime += (now - participant.lastActive);
    }
  }
  return this.save();
};

// Analytics helper methods
roomSchema.methods.getParticipantStats = function() {
  return {
    totalUnique: this.participants.length,
    mostActive: this.participants.reduce((prev, curr) => 
      (curr.contributions.codeChanges > prev.contributions.codeChanges) ? curr : prev
    ),
    averageConnectedTime: this.participants.reduce((sum, p) => 
      sum + p.totalConnectedTime, 0) / this.participants.length,
    reconnectionRate: this.participants.reduce((sum, p) => 
      sum + p.reconnections, 0) / this.participants.length
  };
};

roomSchema.methods.getCodeStats = function() {
  const history = this.codeMetrics.history;
  return {
    currentSize: this.content.length,
    peakSize: this.codeMetrics.peakSize,
    changes: history.length,
    growthRate: history.length > 1 ? 
      (history[history.length - 1].size - history[0].size) / history.length : 0
  };
};

module.exports = mongoose.model('Room', roomSchema);