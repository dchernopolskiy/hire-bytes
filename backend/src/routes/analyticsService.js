const AnalyticsEvent = require('../models/analyticsEvent');

// Analytics tracking service
const trackAnalytics = async (eventName, properties = {}) => {
  try {
    const event = new AnalyticsEvent({
      eventName,
      timestamp: new Date(),
      properties,
      origin: 'server'
    });

    await event.save();
    console.log(`Analytics event tracked: ${eventName}`, properties);
    return event;
  } catch (error) {
    console.error('Failed to track analytics:', error);
  }
};

module.exports = { trackAnalytics };