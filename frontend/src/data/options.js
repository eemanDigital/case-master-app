// Case status options
export const statusOptions = [
  { label: "select status", value: " " },
  { label: "Pending", value: "pending" },
  { label: "Closed", value: "closed" },
  { label: "Decided", value: "decided" },
  { label: "Settled", value: "settled" },
  { label: "Won", value: "won" },
  { label: "Lost", value: "lost" },
];

// Court names options
export const courtOptions = [
  { label: "Select Court", value: " " },
  { label: "Supreme Court", value: "supreme court" },
  { label: "Court of Appeal", value: "court of appeal" },
  { label: "Federal High Court", value: "federal high court" },
  { label: "High Court", value: "high court" },
  { label: "National Industrial Court", value: "national industrial court" },
  { label: "Sharia Courts of Appeal", value: "sharia courts of appeal" },
  { label: "Customary Court of Appeal", value: "customary court of appeal" },
  { label: "Magistrate Court", value: "magistrate court" },
  { label: "Customary Court", value: "customary court" },
  { label: "Sharia Court", value: "sharia court" },
  { label: "Area Court", value: "area court" },
  { label: "Coroner's Court", value: "coroner" },
  { label: "Tribunal", value: "tribunal" },
  { label: "Election Tribunal", value: "election tribunal" },
  { label: "Code of Conduct Tribunal", value: "code of conduct tribunal" },
  { label: "Tax Appeal Tribunal", value: "tax appeal tribunal" },
  { label: "Rent Tribunal", value: "rent tribunal" },
  { label: "Others", value: "others" },
];

// Modes of commencement of case options
export const modesOptions = [
  { label: "Select mode of commencement", value: " " },
  { label: "Writ of Summons", value: "writ of summons" },
  { label: "Originating Summons", value: "originating summons" },
  { label: "Originating Motion", value: "originating motion" },
  { label: "Petition", value: "petition" },
  { label: "Information", value: "information" }, // For criminal cases
  { label: "Charge", value: "charge" }, // For criminal cases
  { label: "Application", value: "application" }, // General term for various applications
  { label: "Notice of Appeal", value: "notice of appeal" },
  { label: "Notice of Application", value: "notice of application" },
  { label: "Other", value: "other" },
];

// Case priority options
export const casePriorityOptions = [
  { label: "Select case priority/rank", value: "" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];
export const todoPriority = [
  { label: "Select todo priority", value: "" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

// data/options.js
export const taskPriorityOptions = [
  { label: "Urgent", value: "urgent" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

export const caseCategoryOptions = [
  { value: "Select case category", label: "" },
  { value: "civil", label: "Civil" },
  { value: "criminal", label: "Criminal" },
];

export const natureOfCaseOptions = [
  { label: "select area of law", value: "" },
  { label: "Contract Dispute", value: "contract dispute" },
  { label: "Personal Injury", value: "personal injury" },
  { label: "Real Estate", value: "real estate" },
  { label: "Land Law", value: "land law" },
  { label: "Pre-election", value: "pre-election" },
  { label: "Election Petition", value: "election petition" },
  { label: "Criminal Law", value: "criminal law" },
  { label: "Family Law", value: "family law" },
  { label: "Intellectual Property", value: "intellectual property" },
  { label: "Employment Law", value: "employment law" },
  { label: "Bankruptcy", value: "bankruptcy" },
  { label: "Estate Law", value: "estate law" },
  { label: "Tortous Liability", value: "tortous liability" },
  { label: "Immigration", value: "immigration" },
  { label: "Maritime", value: "maritime" },
  { label: "Tax Law", value: "tax law" },
  { label: "Constitutional Law", value: "constitutional law" },
  { label: "Environmental Law", value: "environmental law" },
  { label: "Human Rights", value: "human rights" },
  { label: "Corporate Law", value: "corporate law" },
  { label: "Commercial Law", value: "commercial law" },
  { label: "Insurance Law", value: "insurance law" },
  { label: "Consumer Protection", value: "consumer protection" },
  { label: "Cyber Law", value: "cyber law" },
  { label: "Energy Law", value: "energy law" },
  { label: "Entertainment Law", value: "entertainment law" },
  { label: "Healthcare Law", value: "healthcare law" },
  { label: "Media Law", value: "media law" },
  { label: "Military Law", value: "military law" },
  { label: "Public International Law", value: "public international law" },
  { label: "Private International Law", value: "private international law" },
  { label: "Telecommunications Law", value: "telecommunications law" },
  { label: "Transportation Law", value: "transportation law" },
  { label: "Trusts and Estates", value: "trusts and estates" },
  { label: "Urban Development Law", value: "urban development law" },
  { label: "Water Law", value: "water law" },
  { label: "Other", value: "other" },
];

// In your options file
export const invoiceOptions = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "cancelled", label: "Cancelled" },
  { value: "void", label: "Void" },
];

// In your options file
export const methodOptions = [
  { value: "credit_card", label: "Credit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

export const paymentStatusOptions = [
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export const positions = [
  { value: "", label: "Select user's position", disabled: true },
  { value: "Principal", label: "Principal" },
  { value: "Managing Partner", label: "Managing Partner" },
  { value: "Head of Chambers", label: "Head of Chambers" },
  { value: "Associate", label: "Associate" },
  { value: "Senior Associate", label: "Senior Associate" },
  { value: "Junior Associate", label: "Junior Associate" },
  { value: "Counsel", label: "Counsel" },
  { value: "Intern", label: "Intern" },
  { value: "Secretary", label: "Secretary" },
  { value: "Para-legal", label: "Para-legal" },
  // { value: "Client", label: "Client" },
  { value: "Other", label: "Other" },
];

export const roles = [
  { value: "", label: "Select user's role", disabled: true },
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
  { value: "secretary", label: "Secretary" },
  { value: "hr", label: "HR" },
  { value: "super-admin", label: "Super Admin" },
  { value: "client", label: "Client" },
];

export const gender = [
  { value: "", label: "Select user's gender", disabled: true },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export const doc_type = [
  // { value: "", label: "Select document's type" },
  { value: "Court Process", label: "Court Process" },
  { value: "Client Document", label: "Client Document" },
  { value: "Official Correspondence", label: "Official Correspondence" },
  { value: "Others", label: "Others" },
];

export const taskStatusOptions = [
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in-progress" },
  { label: "Completed", value: "completed" },
  { label: "Overdue", value: "overdue" },
  { label: "Cancelled", value: "cancelled" },
];
