const mongoose = require('mongoose');

const complianceCheckSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientCompany',
    required: true,
    index: true
  },
  lawFirmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Firm',
    required: true,
    index: true
  },

  checkType: {
    type: String,
    required: true,
    enum: ['annual_return', 'psc_filing', 'agm']
  },

  status: {
    type: String,
    enum: ['compliant', 'due_soon', 'overdue', 'violation', 'not_applicable'],
    required: true
  },

  dueDate: {
    type: Date,
    default: null
  },
  daysOverdue: {
    type: Number,
    default: 0
  },

  estimatedPenalty: {
    companyLiability: { type: Number, default: 0 },
    perDirectorLiability: { type: Number, default: 0 },
    secretaryLiability: { type: Number, default: 0 },
    totalLiability: { type: Number, default: 0 },
    officerCount: { type: Number, default: 1 },
    calculationBreakdown: { type: String, default: '' }
  },

  legalBasis: {
    type: String,
    default: ''
  },
  advisoryNote: {
    type: String,
    default: ''
  },
  recommendedAction: {
    type: String,
    default: ''
  },

  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

complianceCheckSchema.index({ companyId: 1, checkType: 1 }, { unique: true });

complianceCheckSchema.virtual('checkTypeLabel').get(function() {
  const labels = {
    annual_return: 'Annual Return',
    psc_filing: 'PSC Filing',
   agm: 'Annual General Meeting'
  };
  return labels[this.checkType] || this.checkType;
});

complianceCheckSchema.virtual('statusLabel').get(function() {
  const labels = {
    compliant: 'Compliant',
    due_soon: 'Due Soon',
    overdue: 'Overdue',
    violation: 'Violation',
    not_applicable: 'Not Applicable'
  };
  return labels[this.status] || this.status;
});

complianceCheckSchema.set('toJSON', { virtuals: true });
complianceCheckSchema.set('toObject', { virtuals: true });

const ComplianceCheck = mongoose.model('ComplianceCheck', complianceCheckSchema);

module.exports = ComplianceCheck;
