// Matter configuration constants
export const MATTER_CONFIG = {
  // Matter Types
  MATTER_TYPES: [
    { value: "litigation", label: "Litigation", color: "red", icon: "⚖️" },
    { value: "corporate", label: "Corporate", color: "blue", icon: "🏢" },
    { value: "advisory", label: "Advisory", color: "green", icon: "💡" },
    { value: "property", label: "Property", color: "orange", icon: "🏠" },
    { value: "retainer", label: "Retainer", color: "purple", icon: "📋" },
    { value: "general", label: "General", color: "gray", icon: "📁" },
  ],

  // Status Options
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

  // Priority Options
  PRIORITY_OPTIONS: [
    { value: "low", label: "Low", color: "gray", level: 1 },
    { value: "medium", label: "Medium", color: "blue", level: 2 },
    { value: "high", label: "High", color: "orange", level: 3 },
    { value: "urgent", label: "Urgent", color: "red", level: 4 },
  ],

  // Billing Types
  BILLING_TYPES: [
    { value: "hourly", label: "Hourly" },
    { value: "fixed", label: "Fixed Fee" },
    { value: "contingency", label: "Contingency" },
    { value: "retainer", label: "Retainer" },
    { value: "pro-bono", label: "Pro Bono" },
  ],

  // Categories
  CATEGORIES: [
    { value: "civil", label: "Civil" },
    { value: "criminal", label: "Criminal" },
    { value: "commercial", label: "Commercial" },
    { value: "land", label: "Land" },
    { value: "family", label: "Family" },
    { value: "labor", label: "Labor" },
    { value: "constitutional", label: "Constitutional" },
    { value: "appellate", label: "Appellate" },
  ],

  // Currency Options
  CURRENCIES: [
    { value: "NGN", label: "₦ Naira", symbol: "₦" },
    { value: "USD", label: "$ US Dollar", symbol: "$" },
    { value: "GBP", label: "£ British Pound", symbol: "£" },
    { value: "EUR", label: "€ Euro", symbol: "€" },
  ],

  // Litigation Stages
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

  // Corporate Transactions
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

  // Advisory Types
  ADVISORY_TYPES: [
    { value: "legal-opinion", label: "Legal Opinion" },
    { value: "regulatory-advice", label: "Regulatory Advice" },
    { value: "compliance", label: "Compliance" },
    { value: "risk-assessment", label: "Risk Assessment" },
    { value: "contract-review", label: "Contract Review" },
    { value: "policy-development", label: "Policy Development" },
    { value: "tax-advice", label: "Tax Advice" },
    { value: "labor-employment", label: "Labor & Employment" },
    { value: "intellectual-property", label: "Intellectual Property" },
  ],

  // Client Types
  CLIENT_TYPES: [
    { value: "individual", label: "Individual" },
    { value: "company", label: "Company" },
    { value: "ngo", label: "NGO" },
    { value: "government", label: "Government" },
    { value: "international", label: "International" },
  ],

  // Property Types
  PROPERTY_TYPES: [
    { value: "residential", label: "Residential" },
    { value: "commercial", label: "Commercial" },
    { value: "industrial", label: "Industrial" },
    { value: "agricultural", label: "Agricultural" },
    { value: "mixed-use", label: "Mixed Use" },
    { value: "vacant-land", label: "Vacant Land" },
  ],

  // Property Transactions
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

  // Retainer Types
  RETAINER_TYPES: [
    { value: "general", label: "General Retainer" },
    { value: "special", label: "Special Retainer" },
    { value: "project-based", label: "Project Based" },
    { value: "hourly", label: "Hourly" },
    { value: "fixed-fee", label: "Fixed Fee" },
    { value: "contingency", label: "Contingency" },
  ],

  // General Categories
  GENERAL_CATEGORIES: [
    { value: "legal-opinion", label: "Legal Opinion" },
    { value: "document-review", label: "Document Review" },
    { value: "negotiation", label: "Negotiation" },
    { value: "compliance", label: "Compliance" },
    { value: "research", label: "Legal Research" },
    { value: "drafting", label: "Drafting" },
    { value: "representation", label: "Representation" },
    { value: "consultation", label: "Consultation" },
    { value: "other", label: "Other" },
  ],

  // Nature of Matter options by type
  NATURE_OF_MATTER: {
    litigation: [
      { value: "breach-of-contract", label: "Breach of Contract" },
      { value: "tort", label: "Tort" },
      { value: "recovery-of-debt", label: "Recovery of Debt" },
      { value: "land-dispute", label: "Land Dispute" },
      { value: "employment", label: "Employment" },
      { value: "defamation", label: "Defamation" },
      { value: "family", label: "Family" },
      { value: "criminal-defense", label: "Criminal Defense" },
    ],
    corporate: [
      { value: "incorporation", label: "Incorporation" },
      { value: "merger-acquisition", label: "Merger & Acquisition" },
      { value: "shareholders-agreement", label: "Shareholders Agreement" },
      { value: "regulatory-compliance", label: "Regulatory Compliance" },
      { value: "corporate-governance", label: "Corporate Governance" },
      { value: "restructuring", label: "Restructuring" },
    ],
    advisory: [
      { value: "legal-opinion", label: "Legal Opinion" },
      { value: "regulatory-compliance", label: "Regulatory Compliance" },
      { value: "contract-review", label: "Contract Review" },
      { value: "due-diligence", label: "Due Diligence" },
      { value: "risk-assessment", label: "Risk Assessment" },
      { value: "policy-development", label: "Policy Development" },
    ],
    property: [
      { value: "purchase", label: "Purchase" },
      { value: "sale", label: "Sale" },
      { value: "lease", label: "Lease" },
      { value: "mortgage", label: "Mortgage" },
      { value: "title-perfection", label: "Title Perfection" },
      { value: "property-dispute", label: "Property Dispute" },
    ],
    retainer: [
      { value: "general-retainer", label: "General Retainer" },
      { value: "special-retainer", label: "Special Retainer" },
      { value: "monthly-retainer", label: "Monthly Retainer" },
      { value: "annual-retainer", label: "Annual Retainer" },
    ],
    general: [
      { value: "legal-research", label: "Legal Research" },
      { value: "document-drafting", label: "Document Drafting" },
      { value: "consultation", label: "Consultation" },
      { value: "negotiation", label: "Negotiation" },
      { value: "mediation", label: "Mediation" },
    ],
  },

  // Validation Rules
  VALIDATION_RULES: {
    title: { max: 500, required: true },
    description: { max: 5000, required: true },
    generalComment: { max: 5000 },
    internalNotes: { max: 10000 },
  },

  // Pagination Defaults
  PAGINATION: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
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
