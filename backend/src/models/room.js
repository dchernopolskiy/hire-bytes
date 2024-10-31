const mongoose = require('mongoose');

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
    expires: 1800 // will be automatically deleted after 30 minutes of inactivity
  },
  participants: [{
    userId: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
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
  }
}, {
  timestamps: true,
  collection: 'rooms'
});

// Indexes
roomSchema.index({ roomId: 1 }, { unique: true });
roomSchema.index({ creatorId: 1 });
roomSchema.index({ 'participants.userId': 1 });
roomSchema.index({ lastActive: 1 }, { expireAfterSeconds: 1800 });

// Methods
roomSchema.methods.updateActivity = async function() {
  this.lastActive = new Date();
  return this.save();
};

roomSchema.methods.addParticipant = async function(userId, username) {
  if (!this.participants.find(p => p.userId === userId)) {
    this.participants.push({
      userId,
      username,
      joinedAt: new Date()
    });
    await this.save();
  }
  return this;
};

roomSchema.methods.removeParticipant = async function(userId) {
  this.participants = this.participants.filter(p => p.userId !== userId);
  return this.save();
};

roomSchema.methods.updateContent = async function(content, language) {
  this.content = content;
  if (language) this.language = language;
  return this.save();
};

module.exports = mongoose.model('Room', roomSchema);