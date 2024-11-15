const AnalyticsEvent = require('../models/analyticsEvent');
const Room = require('../models/room');

// Enhanced analytics tracking service
const trackAnalytics = async (eventName, properties = {}) => {
  try {
    const event = new AnalyticsEvent({
      eventName,
      timestamp: new Date(),
      properties,
      origin: 'server'
    });

    // Enrich event with additional metrics based on event type
    switch (eventName) {
      case 'room_created':
        event.properties.initialLanguage = properties.language || 'javascript';
        break;

      case 'user_joined':
        const room = await Room.findOne({ roomId: properties.roomId });
        if (room) {
          event.properties.roomAge = Date.now() - room.created.getTime();
          event.properties.participantCount = room.participants.length;
          event.properties.isReturningUser = room.participants.some(
            p => p.userId === properties.userId && p.reconnections > 0
          );
        }
        break;

      case 'code_changed':
        if (properties.roomId) {
          const room = await Room.findOne({ roomId: properties.roomId });
          if (room) {
            const codeStats = room.getCodeStats();
            event.properties.codeMetrics = {
              currentSize: codeStats.currentSize,
              sizeChange: codeStats.growthRate,
              totalChanges: room.sessionMetrics.totalCodeChanges
            };
          }
        }
        break;

      case 'room_cleaned':
        const cleanedRoom = await Room.findOne({ roomId: properties.roomId });
        if (cleanedRoom) {
          const participantStats = cleanedRoom.getParticipantStats();
          event.properties.roomMetrics = {
            duration: Date.now() - cleanedRoom.created.getTime(),
            totalParticipants: cleanedRoom.participants.length,
            maxConcurrentUsers: cleanedRoom.sessionMetrics.maxConcurrentUsers,
            averageConnectedTime: participantStats.averageConnectedTime,
            totalCodeChanges: cleanedRoom.sessionMetrics.totalCodeChanges,
            totalExecutions: cleanedRoom.sessionMetrics.totalExecutions,
            finalCodeSize: cleanedRoom.content.length,
            languageChanges: cleanedRoom.sessionMetrics.languageChanges.length,
            codeAnalyses: cleanedRoom.sessionMetrics.codeAnalyses
          };
        }
        break;
    }

    await event.save();
    console.log(`Analytics event tracked: ${eventName}`, properties);
    return event;
  } catch (error) {
    console.error('Failed to track analytics:', error);
  }
};

// New analytics aggregation functions
const getAnalyticsDashboard = async (timeRange = '7d') => {
  const end = new Date();
  const start = new Date();
  
  switch (timeRange) {
    case '24h': start.setHours(start.getHours() - 24); break;
    case '7d': start.setDate(start.getDate() - 7); break;
    case '30d': start.setDate(start.getDate() - 30); break;
    default: start.setDate(start.getDate() - 7);
  }

  const rooms = await Room.find({
    created: { $gte: start, $lte: end }
  });

  // Aggregate metrics
  const metrics = {
    overview: {
      totalRooms: rooms.length,
      activeRooms: rooms.filter(r => r.isActive).length,
      totalParticipants: rooms.reduce((sum, r) => sum + r.participants.length, 0),
      averageSessionDuration: rooms.reduce((sum, r) => {
        const duration = end - r.created;
        return sum + duration;
      }, 0) / rooms.length
    },
    
    participation: {
      averageParticipantsPerRoom: rooms.reduce((sum, r) => 
        sum + r.participants.length, 0) / rooms.length,
      maxConcurrentUsers: Math.max(...rooms.map(r => 
        r.sessionMetrics.maxConcurrentUsers)),
      returnRate: rooms.reduce((sum, r) => 
        sum + r.participants.filter(p => p.reconnections > 0).length, 0) / 
        rooms.reduce((sum, r) => sum + r.participants.length, 0)
    },

    codeMetrics: {
      averageCodeSize: rooms.reduce((sum, r) => sum + r.content.length, 0) / rooms.length,
      averageChangesPerRoom: rooms.reduce((sum, r) => 
        sum + r.sessionMetrics.totalCodeChanges, 0) / rooms.length,
      popularLanguages: rooms.reduce((acc, r) => {
        acc[r.language] = (acc[r.language] || 0) + 1;
        return acc;
      }, {}),
      executionsPerRoom: rooms.reduce((sum, r) => 
        sum + r.sessionMetrics.totalExecutions, 0) / rooms.length
    },

    userEngagement: {
      averageConnectedTime: rooms.reduce((sum, r) => {
        const participantStats = r.getParticipantStats();
        return sum + participantStats.averageConnectedTime;
      }, 0) / rooms.length,
      
      contributionDistribution: rooms.reduce((acc, r) => {
        r.participants.forEach(p => {
          if (p.contributions.codeChanges > 0) {
            acc.active = (acc.active || 0) + 1;
          } else {
            acc.passive = (acc.passive || 0) + 1;
          }
        });
        return acc;
      }, {}),
      
      timeOfDayDistribution: rooms.reduce((acc, r) => {
        const hour = new Date(r.created).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {})
    },

    trends: {
      dailyRooms: Array.from({ length: 7 }, (_, i) => {
        const date = new Date(end);
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          count: rooms.filter(r => 
            r.created.toISOString().split('T')[0] === date.toISOString().split('T')[0]
          ).length
        };
      }).reverse(),

      roomDurations: rooms.reduce((acc, r) => {
        const duration = Math.floor((end - r.created) / (1000 * 60)); // minutes
        const bucket = Math.floor(duration / 15) * 15; // 15-minute buckets
        acc[bucket] = (acc[bucket] || 0) + 1;
        return acc;
      }, {})
    }
  };

  return metrics;
};

module.exports = {
  trackAnalytics,
  getAnalyticsDashboard
};