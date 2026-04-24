const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// IMPORT ROUTES
const authRoutes = require("./routes/authRoutes");
const visitorRoutes = require("./routes/visitorRoutes");
const firebaseAuthRoutes = require("./routes/firebaseAuthRoutes");
const { authenticate } = require("./middleware/authMiddleware");
const {
  approveVisitor,
  getVisitorQr,
  scanQr,
} = require("./controllers/visitorController");

// USE ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/auth", firebaseAuthRoutes);
app.use("/api/visitors", visitorRoutes);
app.put("/api/approve/:id", authenticate, approveVisitor);
app.get("/api/visitor/:id/qr", getVisitorQr);
app.post("/api/scan-qr", scanQr);

// Test route
app.get("/", (req, res) => {
  res.send("Smart-Gate Backend is Running");
});

// Server port
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

