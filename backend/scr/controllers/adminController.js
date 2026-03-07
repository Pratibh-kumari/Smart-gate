const Visitor = require("../models/Visitor");
const Blacklist = require("../models/Blacklist");

// Get dashboard summary stats
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now.setDate(now.getDate() - 7));
    const monthStart = new Date(now.setMonth(now.getMonth() - 1));

    // Today's stats
    const todayVisitors = await Visitor.countDocuments({
      createdAt: { $gte: todayStart },
    });
    const todayCheckedIn = await Visitor.countDocuments({
      checkInTime: { $gte: todayStart },
    });

    // Week stats
    const weekVisitors = await Visitor.countDocuments({
      createdAt: { $gte: weekStart },
    });

    // Month stats
    const monthVisitors = await Visitor.countDocuments({
      createdAt: { $gte: monthStart },
    });

    // Current active visitors
    const activeVisitors = await Visitor.countDocuments({
      status: "checked-in",
    });

    // Pending approvals
    const pendingApprovals = await Visitor.countDocuments({
      status: "pending",
      isVerified: true,
    });

    // Status breakdown
    const statusBreakdown = await Visitor.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      today: {
        totalRegistrations: todayVisitors,
        checkedIn: todayCheckedIn,
      },
      week: {
        totalVisitors: weekVisitors,
      },
      month: {
        totalVisitors: monthVisitors,
      },
      current: {
        activeVisitors,
        pendingApprovals,
      },
      statusBreakdown,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get visitor logs with filtering and search
exports.getVisitorLogs = async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { host: { $regex: search, $options: "i" } },
        { purpose: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const visitors = await Visitor.find(query)
      .populate("hostApprovedBy", "name email")
      .populate("checkInBy", "name")
      .populate("checkOutBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Visitor.countDocuments(query);

    res.json({
      visitors,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get overstay alerts
exports.getOverstayAlerts = async (req, res) => {
  try {
    const maxHours = req.query.maxHours || 8; // Default 8 hours
    const cutoffTime = new Date(Date.now() - maxHours * 60 * 60 * 1000);

    const overstayVisitors = await Visitor.find({
      status: "checked-in",
      checkInTime: { $lte: cutoffTime },
    })
      .populate("checkInBy", "name")
      .sort({ checkInTime: 1 });

    const alerts = overstayVisitors.map((visitor) => {
      const durationMs = Date.now() - visitor.checkInTime;
      const hoursOverstay = Math.floor(durationMs / (1000 * 60 * 60));
      return {
        visitor: {
          id: visitor._id,
          name: visitor.name,
          phone: visitor.phone,
          host: visitor.host,
        },
        checkInTime: visitor.checkInTime,
        hoursInside: hoursOverstay,
        severity: hoursOverstay > maxHours * 1.5 ? "high" : "medium",
      };
    });

    res.json({
      count: alerts.length,
      maxHours: parseInt(maxHours),
      alerts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Blacklist management
exports.addToBlacklist = async (req, res) => {
  try {
    const { phone, name, reason } = req.body;
    const adminId = req.user.id;

    // Check if already blacklisted
    const existing = await Blacklist.findOne({ phone });
    if (existing && existing.isActive) {
      return res.status(400).json({ message: "Phone already blacklisted" });
    }

    const blacklist = new Blacklist({
      phone,
      name,
      reason,
      addedBy: adminId,
    });

    await blacklist.save();

    res.status(201).json({
      message: "Added to blacklist successfully",
      blacklist,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBlacklist = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive = true } = req.query;
    const skip = (page - 1) * limit;

    const query = { isActive: isActive === "true" };

    const blacklist = await Blacklist.find(query)
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Blacklist.countDocuments(query);

    res.json({
      blacklist,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeFromBlacklist = async (req, res) => {
  try {
    const { id } = req.params;

    const blacklist = await Blacklist.findById(id);
    if (!blacklist) {
      return res.status(404).json({ message: "Blacklist entry not found" });
    }

    blacklist.isActive = false;
    await blacklist.save();

    res.json({
      message: "Removed from blacklist",
      blacklist,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.checkBlacklist = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ message: "Phone number required" });
    }

    const blacklist = await Blacklist.findOne({ phone, isActive: true });

    if (blacklist) {
      return res.json({
        isBlacklisted: true,
        reason: blacklist.reason,
        addedAt: blacklist.createdAt,
      });
    }

    res.json({
      isBlacklisted: false,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
