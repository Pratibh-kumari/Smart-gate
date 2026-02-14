
const express = require("express");
const router = express.Router();

const {
  registerVisitor,
  sendOtp,
  verifyOtp,
  getVisitorById
} = require("../controllers/visitorController");

router.post("/register", registerVisitor);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// ✅ THIS WAS MISSING
router.get("/:id", getVisitorById);

module.exports = router;
