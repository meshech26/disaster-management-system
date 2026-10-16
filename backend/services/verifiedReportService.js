const AlertBroadcast = require('../models/AlertBroadcast');

// The DMC verification queue contains reports that have not yet been published.
// Draft warnings do not remove their source reports from the queue.
const getUnpublishedVerifiedReportFilter = async () => {
  const publishedReportIds = await AlertBroadcast.distinct('incidentId', {
    status: { $in: ['active', 'completed'] },
    incidentId: { $ne: null }
  });
  return { status: 'verified', _id: { $nin: publishedReportIds } };
};

module.exports = { getUnpublishedVerifiedReportFilter };
