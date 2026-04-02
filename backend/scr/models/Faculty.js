const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  department: { type: String },
  designation: { type: String },
  profileUrl: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Faculty', facultySchema);