const mongoose = require('mongoose');

const filingTaskSchema = new mongoose.Schema({
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
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  taskType: {
    type: String,
    required: true,
    enum: [
      'file_annual_return',
      'file_psc',
      'update_psc',
      'file_director_change',
      'file_address_change',
      'file_share_capital',
      'file_allotment',
      'register_charge',
      'file_agm_resolution',
      'general_filing'
    ]
  },

  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  status: {
    type: String,
    enum: ['pending', 'in_progress', 'filed', 'cancelled'],
    default: 'pending'
  },

  dueDate: {
    type: Date,
    required: true
  },
  filedDate: {
    type: Date,
    default: null
  },
  cacReceiptNumber: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },

  applicablePenalty: {
    type: Number,
    default: 0
  },
  penaltyLegalBasis: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

filingTaskSchema.index({ lawFirmId: 1, status: 1 });
filingTaskSchema.index({ companyId: 1, status: 1 });
filingTaskSchema.index({ lawFirmId: 1, dueDate: 1 });

filingTaskSchema.virtual('taskTypeLabel').get(function() {
  const labels = {
    file_annual_return: 'File Annual Return',
    file_psc: 'File PSC',
    update_psc: 'Update PSC',
    file_director_change: 'File Director Change',
    file_address_change: 'File Address Change',
    file_share_capital: 'File Share Capital',
    file_allotment: 'File Allotment',
    register_charge: 'Register Charge',
    file_agm_resolution: 'File AGM Resolution',
    general_filing: 'General Filing'
  };
  return labels[this.taskType] || this.taskType;
});

filingTaskSchema.virtual('daysUntilDue').get(function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diff = due - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

filingTaskSchema.set('toJSON', { virtuals: true });
filingTaskSchema.set('toObject', { virtuals: true });

const FilingTask = mongoose.model('FilingTask', filingTaskSchema);

module.exports = FilingTask;
