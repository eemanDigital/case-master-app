// ============================================
// NIGERIAN SERVICE TYPES (General Matters)
// ============================================
export const NIGERIAN_GENERAL_SERVICE_TYPES = [
  { value: "notarial-services", label: "Notarial Services" },
  { value: "cac-registration", label: "CAC Registration" },
  { value: "perfection-of-title", label: "Perfection of Title" },
  { value: "litigation", label: "Litigation" },
  { value: "arbitration", label: "Arbitration" },
  { value: "mediation", label: "Mediation" },
  { value: "legal-opinion", label: "Legal Opinion" },
  { value: "drafting", label: "Contract Drafting" },
  { value: "attestation", label: "Document Attestation" },
  { value: "certification", label: "Document Certification" },
  { value: "verification", label: "Document Verification" },
  { value: "regulatory-filing", label: "Regulatory Filing (NAFDAC, CAC)" },
  { value: "other", label: "Other" },
];

// ============================================
// BILLING TYPES (Nigerian Context)
// ============================================
export const BILLING_TYPES = [
  { value: "fixed-fee", label: "Fixed Fee" },
  { value: "lpro-scale", label: "LPRO Scale" },
  { value: "percentage", label: "Percentage-based" },
  { value: "hybrid", label: "Hybrid" },
];

// ============================================
// LPRO SCALES (2023)
// ============================================
export const LPRO_SCALES = [
  { value: "Scale 1", label: "Scale 1" },
  { value: "Scale 2", label: "Scale 2" },
  { value: "Scale 3", label: "Scale 3" },
  { value: "Scale 4", label: "Scale 4" },
  { value: "Scale 5", label: "Scale 5" },
];

// ============================================
// DOCUMENT TYPES
// ============================================
export const DOCUMENT_TYPES = [
  { value: "original", label: "Original" },
  { value: "certified-copy", label: "Certified Copy" },
  { value: "photocopy", label: "Photocopy" },
];

// ============================================
// DISBURSEMENT CATEGORIES
// ============================================
export const DISBURSEMENT_CATEGORIES = [
  { value: "court-fees", label: "Court Fees" },
  { value: "registry-fees", label: "Registry Fees" },
  { value: "professional-fees", label: "Professional Fees" },
  { value: "transport", label: "Transport" },
  { value: "stamps", label: "NBA Stamps" },
  { value: "other", label: "Other" },
];

// ============================================
// REQUIREMENT STATUSES
// ============================================
export const REQUIREMENT_STATUSES = [
  { value: "pending", label: "Pending", color: "orange" },
  { value: "met", label: "Met", color: "green" },
  { value: "not-applicable", label: "Not Applicable", color: "default" },
];

// ============================================
// DELIVERABLE STATUSES
// ============================================
export const DELIVERABLE_STATUSES = [
  { value: "pending", label: "Pending", color: "orange" },
  { value: "in-progress", label: "In Progress", color: "blue" },
  { value: "delivered", label: "Delivered", color: "cyan" },
  { value: "approved", label: "Approved", color: "green" },
];

// ============================================
// NIGERIAN STATES (Jurisdiction)
// ============================================
export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

// ============================================
// TAX RATES
// ============================================
export const TAX_RATES = {
  VAT_RATE: 7.5,
  WHT_INDIVIDUAL: 5,
  WHT_CORPORATE: 10,
};

// ============================================
// CURRENCY OPTIONS
// ============================================
export const CURRENCIES = [
  { value: "NGN", label: "₦ Nigerian Naira", symbol: "₦" },
  { value: "USD", label: "$ US Dollar", symbol: "$" },
  { value: "EUR", label: "€ Euro", symbol: "€" },
  { value: "GBP", label: "£ British Pound", symbol: "£" },
];

// ============================================
// FILTER OPTIONS
// ============================================
export const GENERAL_FILTER_OPTIONS = {
  serviceType: NIGERIAN_GENERAL_SERVICE_TYPES,
  billingType: BILLING_TYPES,
  state: NIGERIAN_STATES.map((s) => ({ value: s, label: s })),
  requirementStatus: REQUIREMENT_STATUSES,
  deliverableStatus: DELIVERABLE_STATUSES,
};

// ============================================
// DEFAULT VALUES
// ============================================
export const GENERAL_DEFAULTS = {
  billing: {
    billingType: "fixed-fee",
    currency: "NGN",
    vatRate: 7.5,
    applyVAT: true,
    applyWHT: true,
    whtRate: 5,
  },
  pagination: {
    page: 1,
    limit: 50,
  },
};
