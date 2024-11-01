const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  userId: {
    type: String,
    index: true
  },
  roomId: {
    type: String,
    index: true
  },
  isCreator: {
    type: Boolean
  },
  properties: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  userProperties: {
    timezone: String,
    language: String,
    platform: String,
    screenSize: String,
    url: String,
    referrer: String
  },
  origin: String,
  // For room-related events
  roomProperties: {
    participantCount: Number,
    duration: Number,
    language: String
  },
  // For code-related events
  codeProperties: {
    language: String,
    codeLength: Number,
    changeType: String
  },
  // For analysis events
  analysisProperties: {
    requestDuration: Number,
    analysisType: String,
    success: Boolean
  }
}, {
  timestamps: true,
  collection: 'analytics_events'
});

// Add indexes for common queries
analyticsEventSchema.index({ eventName: 1, timestamp: -1 });
analyticsEventSchema.index({ roomId: 1, timestamp: -1 });
analyticsEventSchema.index({ userId: 1, timestamp: -1 });
analyticsEventSchema.index({ sessionId: 1, timestamp: -1 });
analyticsEventSchema.index({ 'properties.language': 1 });
analyticsEventSchema.index({ 'userProperties.timezone': 1 });

// Add expiry index to automatically delete old events (90 days)
analyticsEventSchema.index({ timestamp: 1 }, { 
  expireAfterSeconds: 90 * 24 * 60 * 60 
});

// Helper methods
analyticsEventSchema.statics.trackRoomEvent = async function(eventName, roomId, userId, properties = {}) {
  return this.create({
    eventName,
    timestamp: new Date(),
    roomId,
    userId,
    properties
  });
};

analyticsEventSchema.statics.trackUserEvent = async function(eventName, userId, properties = {}) {
  return this.create({
    eventName,
    timestamp: new Date(),
    userId,
    properties
  });
};

analyticsEventSchema.statics.getEventStats = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        timestamp: { 
          $gte: startDate, 
          $lte: endDate 
        }
      }
    },
    {
      $group: {
        _id: '$eventName',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    }
  ]);
};

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

module.exports = AnalyticsEvent;