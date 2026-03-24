const mongoose = require('mongoose');

const clientCompanySchema = new mongoose.Schema({
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

  name: {
    type: String,
    required: true,
    trim: true
  },
  rcNumber: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'small_private',
      'private',
      'public',
      'company_limited_by_guarantee',
      'single_member'
    ]
  },
  incorporationDate: {
    type: Date,
    required: true
  },
  numDirectors: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  hasCompanySecretary: {
    type: Boolean,
    default: false
  },

  firstAnnualReturnFiled: {
    type: Boolean,
    default: false
  },
  lastAnnualReturnDate: {
    type: Date,
    default: null
  },
  lastAGMDate: {
    type: Date,
    default: null
  },

  pscFiled: {
    type: Boolean,
    default: false
  },
  pscFiledDate: {
    type: Date,
    default: null
  },
  pscHasConflict: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },
  isCACInactive: {
    type: Boolean,
    default: false
  },
  isStruck: {
    type: Boolean,
    default: false
  },

  complianceRiskLevel: {
    type: String,
    enum: ['green', 'amber', 'red'],
    default: 'green'
  },
  totalEstimatedLiability: {
    type: Number,
    default: 0
  },
  lastAuditDate: {
    type: Date,
    default: null
  },

  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

clientCompanySchema.index({ lawFirmId: 1, isActive: 1 });
clientCompanySchema.index({ lawFirmId: 1, complianceRiskLevel: 1 });
clientCompanySchema.index({ lawFirmId: 1, rcNumber: 1 }, { unique: true });

clientCompanySchema.virtual('typeLabel').get(function() {
  const labels = {
    small_private: 'Small Private Company',
    private: 'Private Company',
    public: 'Public Company',
    company_limited_by_guarantee: 'Company Limited by Guarantee',
    single_member: 'Single Member Company'
  };
  return labels[this.type] || this.type;
});

clientCompanySchema.set('toJSON', { virtuals: true });
clientCompanySchema.set('toObject', { virtuals: true });

const ClientCompany = mongoose.model('ClientCompany', clientCompanySchema);

module.exports = ClientCompany;
