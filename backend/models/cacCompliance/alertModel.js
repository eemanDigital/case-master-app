const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  lawFirmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Firm',
    required: true,
    index: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientCompany',
    required: true,
    index: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  alertType: {
    type: String,
    enum: [
      'deadline_60_days',
      'deadline_30_days',
      'deadline_7_days',
      'violation_detected',
      'risk_escalated'
    ]
  },

  checkType: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

alertSchema.index({ recipientId: 1, isRead: 1 });

alertSchema.virtual('alertTypeLabel').get(function() {
  const labels = {
    deadline_60_days: 'Deadline in 60 Days',
    deadline_30_days: 'Deadline in 30 Days',
    deadline_7_days: 'Deadline in 7 Days',
    violation_detected: 'Violation Detected',
    risk_escalated: 'Risk Escalated'
  };
  return labels[this.alertType] || this.alertType;
});

alertSchema.set('toJSON', { virtuals: true });
alertSchema.set('toObject', { virtuals: true });

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;
