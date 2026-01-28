// Matter configuration constants - ALIGNED WITH BACKEND SCHEMA
export const MATTER_CONFIG = {
  // Matter Types - MATCHES BACKEND ENUM
  MATTER_TYPES: [
    { value: "litigation", label: "Litigation", color: "red", icon: "⚖️" },
    { value: "corporate", label: "Corporate", color: "blue", icon: "🏢" },
    { value: "advisory", label: "Advisory", color: "green", icon: "💡" },
    { value: "retainer", label: "Retainer", color: "purple", icon: "📋" },
    { value: "property", label: "Property", color: "orange", icon: "🏠" },
    { value: "general", label: "General", color: "gray", icon: "📁" },
  ],

  // Status Options - MATCHES BACKEND ENUM
  STATUS_OPTIONS: [
    { value: "active", label: "Active", color: "green" },
    { value: "pending", label: "Pending", color: "orange" },
    { value: "on-hold", label: "On Hold", color: "yellow" },
    { value: "completed", label: "Completed", color: "blue" },
    { value: "closed", label: "Closed", color: "gray" },
    { value: "archived", label: "Archived", color: "purple" },
    { value: "settled", label: "Settled", color: "lime" },
    { value: "withdrawn", label: "Withdrawn", color: "red" },
    { value: "won", label: "Won", color: "success" },
    { value: "lost", label: "Lost", color: "error" },
  ],

  // Priority Options - MATCHES BACKEND ENUM
  PRIORITY_OPTIONS: [
    { value: "low", label: "Low", color: "gray", level: 1 },
    { value: "medium", label: "Medium", color: "blue", level: 2 },
    { value: "high", label: "High", color: "orange", level: 3 },
    { value: "urgent", label: "Urgent", color: "red", level: 4 },
  ],

  // Categories - MATCHES BACKEND ENUM (Only for litigation matters)
  CATEGORIES: [
    { value: "civil", label: "Civil" },
    { value: "criminal", label: "Criminal" },
    { value: "n/a", label: "Not Applicable" }, // Default for non-litigation
  ],

  // Billing Types - MATCHES BACKEND ENUM
  BILLING_TYPES: [
    { value: "hourly", label: "Hourly" },
    { value: "fixed", label: "Fixed Fee" },
    { value: "contingency", label: "Contingency" },
    { value: "retainer", label: "Retainer" },
    { value: "pro-bono", label: "Pro Bono" },
  ],

  // Currency Options
  CURRENCIES: [
    { value: "NGN", label: "₦ Naira", symbol: "₦" },
    { value: "USD", label: "$ US Dollar", symbol: "$" },
    { value: "GBP", label: "£ British Pound", symbol: "£" },
    { value: "EUR", label: "€ Euro", symbol: "€" },
  ],

  // Nature of Matter options - EXACTLY MATCHES BACKEND ENUM VALUES
  NATURE_OF_MATTER: {
    // LITIGATION - Must match backend enum exactly
    litigation: [
      // Contract & Civil
      { value: "contract dispute", label: "Contract Dispute" },
      { value: "personal injury", label: "Personal Injury" },
      { value: "real estate", label: "Real Estate" },
      { value: "land law", label: "Land Law" },
      { value: "family law", label: "Family Law" },
      { value: "intellectual property", label: "Intellectual Property" },
      { value: "employment law", label: "Employment Law" },
      { value: "bankruptcy", label: "Bankruptcy" },
      { value: "estate law", label: "Estate Law" },
      { value: "tortious liability", label: "Tortious Liability" },

      // Specialized Areas
      { value: "immigration", label: "Immigration" },
      { value: "maritime", label: "Maritime" },
      { value: "tax law", label: "Tax Law" },
      { value: "constitutional law", label: "Constitutional Law" },
      { value: "environmental law", label: "Environmental Law" },
      { value: "human rights", label: "Human Rights" },
      { value: "criminal law", label: "Criminal Law" },
      { value: "insurance law", label: "Insurance Law" },
      { value: "consumer protection", label: "Consumer Protection" },
      { value: "cyber law", label: "Cyber Law" },

      // Election & Political
      { value: "pre-election", label: "Pre-Election" },
      { value: "election petition", label: "Election Petition" },

      // Other
      { value: "other", label: "Other" },
    ],

    // CORPORATE - Must match backend enum exactly
    corporate: [
      { value: "merger and acquisition", label: "Merger & Acquisition" },
      { value: "corporate governance", label: "Corporate Governance" },
      { value: "company incorporation", label: "Company Incorporation" },
      { value: "joint venture", label: "Joint Venture" },
      { value: "shareholder agreement", label: "Shareholder Agreement" },
      { value: "securities", label: "Securities" },
      { value: "banking and finance", label: "Banking & Finance" },
      { value: "capital markets", label: "Capital Markets" },
      { value: "private equity", label: "Private Equity" },
      { value: "venture capital", label: "Venture Capital" },
      { value: "restructuring", label: "Restructuring" },
      { value: "insolvency", label: "Insolvency" },
      { value: "other", label: "Other" },
    ],

    // ADVISORY - Must match backend enum exactly
    advisory: [
      { value: "legal opinion", label: "Legal Opinion" },
      { value: "regulatory compliance", label: "Regulatory Compliance" },
      { value: "due diligence", label: "Due Diligence" },
      { value: "contract review", label: "Contract Review" },
      { value: "legal research", label: "Legal Research" },
      { value: "policy development", label: "Policy Development" },
      { value: "other", label: "Other" },
    ],

    // PROPERTY - Must match backend enum exactly
    property: [
      { value: "property acquisition", label: "Property Acquisition" },
      { value: "property sale", label: "Property Sale" },
      { value: "lease agreement", label: "Lease Agreement" },
      { value: "property development", label: "Property Development" },
      { value: "land use", label: "Land Use" },
      { value: "real estate finance", label: "Real Estate Finance" },
      { value: "other", label: "Other" },
    ],

    // RETAINER - Must match backend enum exactly
    retainer: [
      { value: "general retainer", label: "General Retainer" },
      { value: "general legal services", label: "General Legal Services" },
      { value: "notarial services", label: "Notarial Services" },
      { value: "documentation", label: "Documentation" },
      { value: "other", label: "Other" },
    ],

    // GENERAL - Must match backend enum exactly
    general: [
      { value: "general retainer", label: "General Retainer" },
      { value: "general legal services", label: "General Legal Services" },
      { value: "notarial services", label: "Notarial Services" },
      { value: "documentation", label: "Documentation" },
      { value: "other", label: "Other" },
    ],
  },

  // Client Types (For reference only - not in Matter schema)
  CLIENT_TYPES: [
    { value: "individual", label: "Individual" },
    { value: "company", label: "Company" },
    { value: "ngo", label: "NGO" },
    { value: "government", label: "Government" },
    { value: "international", label: "International" },
  ],

  // Litigation Stages (For reference only - may be in LitigationDetail)
  LITIGATION_STAGES: [
    { value: "pre-filing", label: "Pre-Filing" },
    { value: "filed", label: "Filed" },
    { value: "service", label: "Service" },
    { value: "pleadings", label: "Pleadings" },
    { value: "discovery", label: "Discovery" },
    { value: "pre-trial", label: "Pre-Trial" },
    { value: "trial", label: "Trial" },
    { value: "judgment", label: "Judgment" },
    { value: "appeal", label: "Appeal" },
    { value: "enforcement", label: "Enforcement" },
    { value: "closed", label: "Closed" },
  ],

  // Corporate Transactions (For reference only - may be in CorporateDetail)
  CORPORATE_TRANSACTIONS: [
    { value: "incorporation", label: "Incorporation" },
    { value: "merger-acquisition", label: "Merger & Acquisition" },
    { value: "share-transfer", label: "Share Transfer" },
    { value: "board-resolution", label: "Board Resolution" },
    { value: "regulatory-compliance", label: "Regulatory Compliance" },
    { value: "contract-drafting", label: "Contract Drafting" },
    { value: "due-diligence", label: "Due Diligence" },
    { value: "restructuring", label: "Restructuring" },
    { value: "dissolution", label: "Dissolution" },
  ],

  // Property Types (For reference only - may be in PropertyDetail)
  PROPERTY_TYPES: [
    { value: "residential", label: "Residential" },
    { value: "commercial", label: "Commercial" },
    { value: "industrial", label: "Industrial" },
    { value: "agricultural", label: "Agricultural" },
    { value: "mixed-use", label: "Mixed Use" },
    { value: "vacant-land", label: "Vacant Land" },
  ],

  // Property Transactions (For reference only - may be in PropertyDetail)
  PROPERTY_TRANSACTIONS: [
    { value: "purchase", label: "Purchase" },
    { value: "sale", label: "Sale" },
    { value: "lease", label: "Lease" },
    { value: "mortgage", label: "Mortgage" },
    { value: "assignment", label: "Assignment" },
    { value: "sub-lease", label: "Sub-Lease" },
    { value: "consent", label: "Governor's Consent" },
    { value: "perfection", label: "Perfection" },
  ],

  // Validation Rules - MATCHES BACKEND SCHEMA
  VALIDATION_RULES: {
    title: {
      max: 500,
      required: true,
      message: "Title must be less than 500 characters",
    },
    description: {
      max: 5000,
      required: true,
      message: "Description must be less than 5000 characters",
    },
    generalComment: {
      max: 5000,
      message: "General comment must be less than 5000 characters",
    },
    internalNotes: {
      max: 10000,
      message: "Internal notes must be less than 10000 characters",
    },
  },

  // Pagination Defaults
  PAGINATION: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },

  // Helper to get nature options for a specific matter type
  getNatureOptions: (matterType) => {
    return MATTER_CONFIG.NATURE_OF_MATTER[matterType] || [];
  },

  // Helper to validate if a nature value is valid for matter type
  isValidNatureForType: (matterType, natureValue) => {
    const options = MATTER_CONFIG.NATURE_OF_MATTER[matterType] || [];
    return options.some((option) => option.value === natureValue);
  },
};

// Helper functions
export const getStatusColor = (status) => {
  const statusObj = MATTER_CONFIG.STATUS_OPTIONS.find(
    (s) => s.value === status,
  );
  return statusObj?.color || "default";
};

export const getPriorityColor = (priority) => {
  const priorityObj = MATTER_CONFIG.PRIORITY_OPTIONS.find(
    (p) => p.value === priority,
  );
  return priorityObj?.color || "default";
};

export const formatCurrency = (amount, currency = "NGN") => {
  const currencyInfo = MATTER_CONFIG.CURRENCIES.find(
    (c) => c.value === currency,
  );
  const symbol = currencyInfo?.symbol || currency;

  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount || 0).replace(currency, symbol);
};

export const getMatterTypeIcon = (type) => {
  const typeObj = MATTER_CONFIG.MATTER_TYPES.find((t) => t.value === type);
  return typeObj?.icon || "📄";
};

// Data transformation utilities to ensure frontend-backend alignment
export const transformForBackend = (formData) => {
  const transformed = { ...formData };

  // Ensure category is valid (only for litigation matters)
  if (transformed.matterType === "litigation") {
    if (!["civil", "criminal", "n/a"].includes(transformed.category)) {
      transformed.category = "n/a";
    }
  } else {
    // Non-litigation matters should have category as 'n/a'
    transformed.category = "n/a";
  }

  // Ensure natureOfMatter is valid for the selected matterType
  const validNatures =
    MATTER_CONFIG.NATURE_OF_MATTER[transformed.matterType] || [];
  const validNatureValues = validNatures.map((n) => n.value);

  if (!validNatureValues.includes(transformed.natureOfMatter)) {
    // If invalid, set to first valid option or empty
    transformed.natureOfMatter = validNatureValues[0] || "";
  }

  return transformed;
};
