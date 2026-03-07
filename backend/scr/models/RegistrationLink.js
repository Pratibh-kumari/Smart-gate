const mongoose = require('mongoose');

const registrationLinkSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  host: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    default: 'General Visit'
  },
  validUntil: {
    type: Date,
    required: true
  },
  maxUses: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('RegistrationLink', registrationLinkSchema);
