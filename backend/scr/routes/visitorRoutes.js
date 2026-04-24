
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");

const {
  registerVisitor,
  sendOtp,
  verifyOtp,
  getVisitorById,
  getPendingVisitors,
  getHostVisitors,
  approveVisitor,
  rejectVisitor,
  getVisitorQr,
  scanQr,
  checkInVisitor,
  getApprovedVisitors,
  getActiveVisitors,
  getGuardSummary,
  checkOutVisitor,
  sendQRCodeEmail
} = require("../controllers/visitorController");

// Public routes
router.post("/register", registerVisitor);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/:id/qr", getVisitorQr);
router.post("/scan-qr", scanQr);

// Protected routes (require authentication)
router.get("/pending", authenticate, getPendingVisitors);
router.get("/host/visitors", authenticate, getHostVisitors);
router.post("/approve", authenticate, approveVisitor);
router.put("/approve/:id", authenticate, approveVisitor);
router.put("/reject/:id", authenticate, rejectVisitor);
router.get("/approved", authenticate, getApprovedVisitors);
router.post("/check-in", authenticate, checkInVisitor);
router.get("/active", authenticate, getActiveVisitors);
router.get("/guard-summary", authenticate, getGuardSummary);
router.post("/check-out", authenticate, checkOutVisitor);
router.post("/:id/send-qr-email", authenticate, sendQRCodeEmail);

// Get visitor by ID
router.get("/:id", getVisitorById);

module.exports = router;
