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

export const taskPriorityOptions = [
  { value: "Select task priority", label: "" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
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

export const invoiceOptions = [
  { label: "Select Invoice status", value: "" },
  { label: "Paid", value: "paid" },
  { label: "Unpaid", value: "unpaid" },
  { label: "Overdue", value: "overdue" },
];

export const methodOptions = [
  { label: "Select payment method", value: "" },
  { label: "Credit Card", value: "credit_card" },
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "Cash", value: "cash" },
  { label: "Cheque", value: "cheque" },
  { label: "Other", value: "" },
];

export const positions = [
  "select user's position",
  "Principal",
  "Managing Partner",
  "Head of Chambers",
  "Associate",
  "Senior Associate",
  "Junior Associate",
  "Counsel",
  "Intern",
  "Secretary",
  "Para-legal",
  "Client",
  "other",
];

export const roles = [
  "select user's role",
  "user",
  "admin",
  "secretary",
  "hr",
  "super-admin",
  "client",
];

export const gender = ["select user's gender", "male", "female"];
