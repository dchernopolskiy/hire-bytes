const express = require('express');
const router = express.Router();
const AnalyticsEvent = require('../models/analyticsEvent');

// Helper function to get date range
const getDateRange = (range) => {
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
      start.setDate(start.getDate() - 7); // Default to 7 days
  }
  
  return { start, end };
};

// Dashboard data endpoint
router.get('/dashboard', async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    const { start, end } = getDateRange(range);

    // Get total rooms created
    const totalRooms = await AnalyticsEvent.countDocuments({
      eventName: 'room_created',
      timestamp: { $gte: start, $lte: end }
    });

    // Get active users (unique users in the time period)
    const activeUsers = await AnalyticsEvent.distinct('userId', {
      timestamp: { $gte: start, $lte: end }
    });

    // Get average session duration
    const sessionDurations = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventName: 'room_exit',
          timestamp: { $gte: start, $lte: end },
          'roomProperties.duration': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          averageDuration: { $avg: '$roomProperties.duration' }
        }
      }
    ]);

    // Get total code analyses
    const totalCodeAnalyses = await AnalyticsEvent.countDocuments({
      eventName: 'code_analyzed',
      timestamp: { $gte: start, $lte: end }
    });

    // Get daily trends
    const trends = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventName: 'room_created',
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          rooms: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          rooms: 1
        }
      }
    ]);

    // Get language distribution
    const languages = await AnalyticsEvent.aggregate([
      {
        $match: {
          'properties.language': { $exists: true },
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$properties.language',
          value: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          value: 1
        }
      }
    ]);

    // Get daily activity
    const dailyActivity = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$timestamp"
            }
          },
          sessions: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          sessions: 1
        }
      }
    ]);

    // Get recent activity
    const recentActivity = await AnalyticsEvent.find({
      timestamp: { $gte: start, $lte: end }
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .lean()
    .then(events => events.map(event => ({
      id: event._id.toString(),
      type: event.eventName,
      userId: event.userId,
      username: event.username,
      timestamp: event.timestamp.toISOString()
    })));

    // Send response
    res.json({
      overview: {
        totalRooms,
        activeUsers: activeUsers.length,
        averageSessionDuration: sessionDurations[0]?.averageDuration || 0,
        totalCodeAnalyses
      },
      trends,
      languages,
      dailyActivity,
      recentActivity
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Track new analytics event
router.post('/track', async (req, res) => {
  try {
    const event = new AnalyticsEvent(req.body);
    await event.save();
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Event tracking error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

module.exports = router;