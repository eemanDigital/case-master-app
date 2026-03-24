module.exports = {
  annualReturns: {
    firstReturnMonthsFromIncorporation: 18,
    subsequentReturnDaysAfterAGM: 42,

    fixedAnnualPenalty: {
      small_private: 3000,
      private: 5000,
      public: 10000,
      company_limited_by_guarantee: 5000,
      single_member: 3000
    },

    dailyPenaltyPerOfficer: {
      small_private: 250,
      private: 500,
      public: 1000,
      company_limited_by_guarantee: 500,
      single_member: 250
    },
    dailyPenaltyEffectiveDate: new Date('2024-04-01'),
    legalBasis: 'Section 417 & 421, CAMA 2020; Companies Regulations 2021'
  },

  psc: {
    filingDeadlineDays: 30,
    dailyPenaltyPerOfficer: 10000,
    legalBasis: 'Sections 119 & 791, CAMA 2020; PSC Regulations 2022',
    consequences: [
      'Company marked INACTIVE on CAC portal',
      'All post-registration CAC applications blocked',
      'Letter of Good Standing refused',
      'Officers face up to 2 years imprisonment for false statements (Section 462, CAMA 2020)'
    ]
  },

  agm: {
    firstAGMMonthsFromIncorporation: 18,
    subsequentAGMMaxIntervalMonths: 15,
    exemptTypes: ['small_private', 'single_member'],
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
    amberThresholdDays: 60,
    redThresholdDays: 90
  }
};
