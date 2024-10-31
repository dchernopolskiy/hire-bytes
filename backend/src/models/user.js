const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  createdRooms: [{
    type: String,
    ref: 'Room'
  }],
  joinedRooms: [{
    type: String,
    ref: 'Room'
  }],
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'users'
});

module.exports = mongoose.model('User', userSchema);