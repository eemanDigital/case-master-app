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
      'small_private',          // Small Private Company
      'private',                // Private Company (not small)
      'public',                 // Public Company
      'company_limited_by_guarantee', // Company Limited by Guarantee
      'single_member',          // Single Member Company
      'llp',                    // Limited Liability Partnership
      'lp',                     // Limited Partnership
      'business_name',          // Business Name
      'incorporated_trustees'   // Incorporated Trustees
    ]
  },
  
  // For companies - share capital determines filing fee bracket
  shareCapital: {
    type: Number,
    default: 100000  // Default ₦100,000 (lowest bracket)
  },
  shareCapitalCurrency: {
    type: String,
    default: 'NGN'
  },

  incorporationDate: {
    type: Date,
    required: true
  },
  
  // For companies/LLP/LP - number of directors/partners
  numDirectors: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  
  // For companies
  hasCompanySecretary: {
    type: Boolean,
    default: false
  },
  
  // For Business Names
  proprietorshipType: {
    type: String,
    enum: ['sole_proprietorship', 'partnership'],
    default: 'sole_proprietorship'
  },
  numberOfProprietors: {
    type: Number,
    default: 1
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

// Indexes
clientCompanySchema.index({ lawFirmId: 1, isActive: 1 });
clientCompanySchema.index({ lawFirmId: 1, complianceRiskLevel: 1 });
clientCompanySchema.index({ lawFirmId: 1, rcNumber: 1 }, { unique: true });
clientCompanySchema.index({ lawFirmId: 1, type: 1 });

// Virtual for type label
clientCompanySchema.virtual('typeLabel').get(function() {
  const labels = {
    small_private: 'Small Private Company',
    private: 'Private Company',
    public: 'Public Company',
    company_limited_by_guarantee: 'Company Limited by Guarantee',
    single_member: 'Single Member Company',
    llp: 'Limited Liability Partnership',
    lp: 'Limited Partnership',
    business_name: 'Business Name',
    incorporated_trustees: 'Incorporated Trustees'
  };
  return labels[this.type] || this.type;
});

// Virtual for filing fee (calculated)
clientCompanySchema.virtual('estimatedFilingFee').get(function() {
  const complianceRules = require('../../config/complianceRules');
  
  if (this.type === 'business_name') {
    return complianceRules.annualReturns.baseFilingFee.business_name;
  }
  
  if (['small_private', 'private', 'public', 'company_limited_by_guarantee', 'single_member', 'llp', 'lp'].includes(this.type)) {
    const baseFee = complianceRules.annualReturns.baseFilingFee.company;
    const shareCapital = this.shareCapital || 0;
    
    const brackets = complianceRules.annualReturns.shareCapitalFees.brackets;
    let shareCapitalFee = complianceRules.annualReturns.shareCapitalFees.defaultFee;
    
    for (const bracket of brackets) {
      if (shareCapital >= bracket.min && shareCapital <= bracket.max) {
        shareCapitalFee = bracket.fee;
        break;
      }
    }
    
    return baseFee + shareCapitalFee;
  }
  
  return 0;
});

// Virtual for entity category (company vs non-company)
clientCompanySchema.virtual('isCompany').get(function() {
  return ['small_private', 'private', 'public', 'company_limited_by_guarantee', 'single_member', 'llp', 'lp'].includes(this.type);
});

// Virtual for has officer liability
clientCompanySchema.virtual('hasOfficerLiability').get(function() {
  const complianceRules = require('../../config/complianceRules');
  return complianceRules.officerEntityTypes.includes(this.type);
});

clientCompanySchema.set('toJSON', { virtuals: true });
clientCompanySchema.set('toObject', { virtuals: true });

const ClientCompany = mongoose.model('ClientCompany', clientCompanySchema);

module.exports = ClientCompany;
