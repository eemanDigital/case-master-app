module.exports = {
  // Effective date for new penalty rates (31 Oct 2024)
  effectiveDate: new Date('2024-10-31'),

  // Entity types supported by the system
  entityTypes: {
    SMALL_COMPANY: 'small_private',
    PRIVATE_COMPANY: 'private',
    PUBLIC_COMPANY: 'public',
    COMPANY_LIMITED_BY_GUARANTEE: 'company_limited_by_guarantee',
    SINGLE_MEMBER: 'single_member',
    LLP: 'llp',
    LP: 'lp',
    BUSINESS_NAME: 'business_name',
    INCORPORATED_TRUSTEES: 'incorporated_trustees'
  },

  // Entity types with officers (directors, partners)
  officerEntityTypes: [
    'small_private',
    'private',
    'public',
    'company_limited_by_guarantee',
    'single_member',
    'llp',
    'lp'
  ],

  // Entity types that only the entity itself is liable (no officer multiplication)
  entityOnlyLiabilityTypes: [
    'business_name',
    'incorporated_trustees'
  ],

  annualReturns: {
    firstReturnMonthsFromIncorporation: 18,
    subsequentReturnDaysAfterAGM: 42,

    // Base filing fees
    baseFilingFee: {
      company: 10000,      // ₦10,000 for LTD companies
      business_name: 5000  // ₦5,000 flat fee for business names
    },

    // Share capital fee brackets for companies
    shareCapitalFees: {
      // Format: { min: amount, max: amount, fee: amount }
      brackets: [
        { min: 100000, max: 100000000, fee: 5000 },      // ₦100k - ₦100M: ₦5,000
        { min: 100000001, max: 500000000, fee: 100000 },  // ₦100M - ₦500M: ₦100,000
        { min: 500000001, max: 1000000000, fee: 150000 }, // ₦500M - ₦1B: ₦150,000
        { min: 1000000001, max: Infinity, fee: 200000 }   // Above ₦1B: ₦200,000
      ],
      defaultFee: 5000  // Default to lowest bracket if share capital missing
    },

    // Daily default penalty rates (per day)
    dailyPenaltyPerDay: {
      small_private: 100,
      private: 200,
      public: 500,
      company_limited_by_guarantee: 200,
      single_member: 100,
      llp: 200,
      lp: 100,
      business_name: 100,
      incorporated_trustees: 200
    },

    // One-off penalty for late filing
    oneOffPenalty: {
      small_private: 5000,
      private: 10000,
      public: 25000,
      company_limited_by_guarantee: 10000,
      single_member: 5000,
      llp: 10000,
      lp: 10000,
      business_name: 5000,
      incorporated_trustees: 10000
    },

    // Annual return specific additional penalty (Section 417/421, CAMA 2020)
    annualReturnDefaultPenalty: {
      small_private: 1000,
      private: 2000,
      public: 5000,
      company_limited_by_guarantee: 2000,
      single_member: 1000,
      llp: 2000,
      lp: 1000,
      business_name: 5000,
      incorporated_trustees: 10000
    },

    // Per-officer daily penalty (for companies with officers)
    dailyPenaltyPerOfficer: {
      small_private: 250,
      private: 500,
      public: 1000,
      company_limited_by_guarantee: 500,
      single_member: 250,
      llp: 500,
      lp: 250
    },

    dailyPenaltyEffectiveDate: new Date('2024-04-01'),
    legalBasis: 'Section 417 & 421, CAMA 2020; Companies Regulations 2021'
  },

  psc: {
    // PSC applies ONLY to companies and LLPs
    applicableEntityTypes: [
      'small_private',
      'private',
      'public',
      'company_limited_by_guarantee',
      'single_member',
      'llp'
    ],
    filingDeadlineDays: 30,
    legalBasis: 'Sections 119 & 791, CAMA 2020; PSC Regulations 2022',
    
    // Per day penalties from PSC Regulations 2022
    dailyPenaltyPerDay: {
      // Section 2: Default in PSC reporting requirements (company/LLP)
      default_reporting: {
        small_private: 5000,      // N5,000 - small company
        private: 10000,           // N10,000 - company other than small or GTE
        public: 25000,            // N25,000 - public company
        company_limited_by_guarantee: 5000, // Note: Not specified, using small company rate
        single_member: 5000,     // N5,000 - small company
        llp: 5000,               // N5,000 - limited liability partnership
      },
      // Section 5: Not identifying/disclosing PSC
      not_identifying: {
        small_private: 10000,     // N10,000
        private: 20000,           // N20,000
        public: 25000,            // N25,000
        company_limited_by_guarantee: 10000,
        single_member: 10000,
        llp: 10000,              // N10,000
      },
      // Section 6: PSC on record not accurate
      inaccurate_psc: {
        small_private: 50000,    // N50,000
        private: 100000,          // N100,000
        public: 200000,          // N200,000
        company_limited_by_guarantee: 50000,
        single_member: 50000,
        llp: 50000,              // N50,000
      },
      // Section 7: Not complying with Commission directives (daily)
      commission_directive: {
        small_private: 10000,    // N10,000
        private: 20000,           // N20,000
        public: 25000,            // N25,000
        company_limited_by_guarantee: 10000,
        single_member: 10000,
        llp: 10000,              // N10,000
      }
    },
    
    // One-off penalties
    oneOffPenalty: {
      small_private: 5000,
      private: 10000,
      public: 25000,
      company_limited_by_guarantee: 5000,
      single_member: 5000,
      llp: 5000,
    },
    
    consequences: [
      'Company/LLP status reflected as "INACTIVE" on CAC portal (Section 7)',
      'All post-registration CAC applications blocked (Section 13)',
      'Letter of Good Standing refused (Section 14)',
      'PSC filing required before company registration (Section 13)',
      'PSC filing required before annual return filing (Section 13)',
      'Officers face up to 2 years imprisonment for false statements (Section 9/11)'
    ]
  },

  agm: {
    // AGM applies ONLY to companies (not LLPs, LP, Business Names, or Incorporated Trustees)
    applicableEntityTypes: [
      'small_private',
      'private',
      'public',
      'company_limited_by_guarantee',
      'single_member'
    ],
    firstAGMMonthsFromIncorporation: 18,
    subsequentAGMMaxIntervalMonths: 15,
    exemptTypes: ['small_private', 'single_member'],  // Exempt but still tracked
    legalBasis: 'Section 371, CAMA 2020'
  },

  filingDeadlines: {
    directorChange: { days: 14, penalty: 5000, legalBasis: 'Companies Regulations 2021' },
    addressChange: { days: 14, penaltyPerOfficerPerDay: 50, legalBasis: 'Companies Regulations 2021' },
    shareholdingChange: { days: 14, penalty: 5000, legalBasis: 'Companies Regulations 2021' },
    returnOfAllotment: { days: 14, penalty: { public: 10000, default: 5000 }, legalBasis: 'Companies Regulations 2021' },
    shareCapital: { days: 14, penalty: { public: 10000, default: 5000 }, legalBasis: 'Companies Regulations 2021' },
    chargesRegistration: { days: 90, penalty: { public: 10000, default: 5000 }, legalBasis: 'Section 139, CAMA 2020' }
  },

  strikeOff: {
    nonFilingYearsThreshold: 10,
    legalBasis: 'Section 692, CAMA 2020'
  },

  riskLevels: {
    amberThresholdDays: 30,   // Changed from 60
    redThresholdDays: 90,     // Changed from 90
    // Risk level calculation based on days late:
    // daysLate <= 0 → LOW (compliant)
    // daysLate <= 30 → MEDIUM
    // daysLate > 30 → HIGH
  }
};
