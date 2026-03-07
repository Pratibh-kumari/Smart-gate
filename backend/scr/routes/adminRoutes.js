const express = require("express");
const router = express.Router();
const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const {
  getDashboardStats,
  getVisitorLogs,
  getOverstayAlerts,
  addToBlacklist,
  getBlacklist,
  removeFromBlacklist,
  checkBlacklist,
} = require("../controllers/adminController");

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize("admin"));

// Dashboard & Analytics
router.get("/dashboard/stats", getDashboardStats);
router.get("/visitors/logs", getVisitorLogs);
router.get("/visitors/overstay", getOverstayAlerts);

// Blacklist management
router.post("/blacklist", addToBlacklist);
router.get("/blacklist", getBlacklist);
router.delete("/blacklist/:id", removeFromBlacklist);
router.get("/blacklist/check", checkBlacklist);

module.exports = router;
