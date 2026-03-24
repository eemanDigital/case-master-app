const mongoose = require('mongoose');

const advisoryLetterSchema = new mongoose.Schema({
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
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  subject: {
    type: String,
    required: true
  },
  templateType: {
    type: String,
    enum: [
      'annual_return_overdue',
      'psc_violation',
      'agm_non_compliance',
      'general_non_compliance'
    ]
  },
  content: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ['draft', 'sent'],
    default: 'draft'
  },
  sentAt: {
    type: Date,
    default: null
  },
  sentTo: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

advisoryLetterSchema.index({ lawFirmId: 1, status: 1 });
advisoryLetterSchema.index({ companyId: 1, status: 1 });

advisoryLetterSchema.virtual('templateTypeLabel').get(function() {
  const labels = {
    annual_return_overdue: 'Annual Returns Overdue',
    psc_violation: 'PSC Violation',
    agm_non_compliance: 'AGM Non-Compliance',
    general_non_compliance: 'General Non-Compliance'
  };
  return labels[this.templateType] || this.templateType;
});

advisoryLetterSchema.set('toJSON', { virtuals: true });
advisoryLetterSchema.set('toObject', { virtuals: true });

const AdvisoryLetter = mongoose.model('AdvisoryLetter', advisoryLetterSchema);

module.exports = AdvisoryLetter;
