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
const visitorRoutes = require("./routes/visitorRoutes");

// USE ROUTES
app.use("/api/visitors", visitorRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Smart-Gate Backend is Running");
});

// Server port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

