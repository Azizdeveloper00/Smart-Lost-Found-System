const Item = require('../models/Item');

const itemFields = 'title description category type location date image status createdAt updatedAt';

const getDashboardStats = async (req, res) => {
  try {
    const [summary] = await Item.aggregate([
      { $match: { reportedBy: req.user._id } },
      { $group: {
        _id: null,
        totalLost: { $sum: { $cond: [{ $eq: ['$type', 'Lost'] }, 1, 0] } },
        totalFound: { $sum: { $cond: [{ $eq: ['$type', 'Found'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
        activeReports: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
      } },
    ]);

    const recentReports = await Item.find({ reportedBy: req.user._id })
      .select(itemFields)
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();
    const recentlyFound = await Item.find({ type: 'Found' })
      .select(itemFields)
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    return res.json({
      totalLost: summary?.totalLost || 0,
      totalFound: summary?.totalFound || 0,
      resolved: summary?.resolved || 0,
      activeReports: summary?.activeReports || 0,
      recentReports,
      recentlyFound,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load dashboard data.' });
  }
};

module.exports = { getDashboardStats };
