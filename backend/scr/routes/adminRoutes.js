const notifyAllFaculty = require("../notifyAllFaculty");
// Notify all faculty (triggered when a user requests a faculty member)
router.post("/faculty/notify", async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: "Subject and message are required" });
  }
  try {
    const results = await notifyAllFaculty(subject, message);
    res.json({ message: "Notifications sent", results });
  } catch (err) {
    res.status(500).json({ error: "Failed to send notifications" });
  }
});
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

const Faculty = require("../models/Faculty");
const path = require("path");

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

// Faculty Management
// Get all faculty
router.get("/faculty", async (req, res) => {
  try {
    const faculty = await Faculty.find();
    res.json(faculty);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch faculty" });
  }
});

// Refresh faculty list (scrape and update)
router.post("/faculty/refresh", async (req, res) => {
  try {
    const scraperPath = path.join(__dirname, "../facultyScraper.js");
    const scraper = require(scraperPath);
    await scraper();
    res.json({ message: "Faculty list refreshed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to refresh faculty" });
  }
});

// Update a faculty member
router.put("/faculty/:id", async (req, res) => {
  try {
    const updated = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update faculty" });
  }
});

// Delete a faculty member
router.delete("/faculty/:id", async (req, res) => {
  try {
    await Faculty.findByIdAndDelete(req.params.id);
    res.json({ message: "Faculty deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete faculty" });
  }
});

module.exports = router;
