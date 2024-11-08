const express = require('express');
const router = express.Router();
const AnalyticsEvent = require('../models/analyticsEvent');
const Room = require('../models/room');

// Helper function to get date range
const getDateRange = (range) => {
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  const start = new Date();
  
  switch (range) {
    case '24h':
      start.setUTCHours(start.getUTCHours() - 24);
      break;
    case '7d':
      start.setUTCDate(start.getUTCDate() - 7);
      break;
    case '30d':
      start.setUTCDate(start.getUTCDate() - 30);
      break;
    default:
      start.setUTCDate(start.getUTCDate() - 7);
  }
  start.setUTCHours(0, 0, 0, 0);
  
  return { start, end };
};

router.get('/dashboard', async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    const { start, end } = getDateRange(range);

    console.log('Fetching analytics for range:', { start, end });

    const [
      totalRooms,
      activeUsers,
      codeAnalyses,
      trends,
      languages,
      dailyActivity,
      recentActivity
    ] = await Promise.all([
      // Total rooms created in period
      AnalyticsEvent.countDocuments({
        eventName: 'room_created',
        timestamp: { $gte: start, $lte: end }
      }),

      // Active users (unique)
      AnalyticsEvent.distinct('properties.userId', {
        timestamp: { $gte: start, $lte: end }
      }),

      // Code analyses
      AnalyticsEvent.countDocuments({
        eventName: 'code_analyzed',
        timestamp: { $gte: start, $lte: end }
      }),

      // Daily trends
      AnalyticsEvent.aggregate([
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
      ]),

      // Language distribution
      AnalyticsEvent.aggregate([
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
      ]),

      // Daily activity (all events)
      AnalyticsEvent.aggregate([
        {
          $match: {
            timestamp: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
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
      ]),

      // Recent activity
      AnalyticsEvent.find({
        timestamp: { $gte: start, $lte: end }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean()
    ]);

    // Process recent activity
    const formattedRecentActivity = recentActivity.map(event => ({
      id: event._id.toString(),
      type: event.eventName,
      userId: event.properties?.userId,
      username: event.properties?.username,
      timestamp: event.timestamp.toISOString()
    }));

    // Fill in missing dates in trends
    const allDates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      allDates.push(d.toISOString().split('T')[0]);
    }
    
    const filledTrends = allDates.map(date => ({
      date,
      rooms: trends.find(t => t.date === date)?.rooms || 0
    }));

    res.json({
      overview: {
        totalRooms,
        activeUsers: activeUsers.length,
        totalCodeAnalyses: codeAnalyses,
        averageSessionDuration: 0 // If you want to track this, we need to modify room exit event
      },
      trends: filledTrends,
      languages,
      dailyActivity,
      recentActivity: formattedRecentActivity
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

module.exports = router;