// Case status options
export const statusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Closed", value: "closed" },
  { label: "Decided", value: "decided" },
  { label: "Settled", value: "settled" },
  { label: "Won", value: "won" },
  { label: "Lost", value: "lost" },
];

// Court names options
export const courtOptions = [
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
  { label: "Coroner", value: "coroner" },
  { label: "Tribunal", value: "tribunal" },
  { label: "Others", value: "others" },
];

// Modes of commencement of case options
export const modesOptions = [
  { label: "Writ of Summons", value: "writ of summons" },
  { label: "Originating Summons", value: "originating summons" },
  { label: "Originating Motion", value: "originating motion" },
  { label: "Petition", value: "petition" },
  { label: "Other", value: "other" },
];

// Case priority options
export const casePriorityOptions = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];
export const todoPriority = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

export const taskPriorityOptions = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const caseCategoryOptions = [
  { value: "civil", label: "Civil" },
  { value: "criminal", label: "Criminal" },
];

export const natureOfCaseOptions = [
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
  { label: "Other", value: "other" },
];

export const invoiceOptions = [
  { label: "Paid", value: "paid" },
  { label: "Unpaid", value: "unpaid" },
  { label: "Overdue", value: "overdue" },
];

export const methodOptions = [
  { label: "Credit Card", value: "credit_card" },
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "Cash", value: "cash" },
  { label: "Cheque", value: "cheque" },
];

export const positions = [
  "Select a position",
  "principal",
  "managing_partner",
  "head_of_chambers",
  "associate",
  "senior_associate",
  "junior_associate",
  "counsel",
  "intern",
  "secretary",
  "paralegal",
  "client",
  "other",
];

export const roles = ["user", "admin", "secretary", "hr", "super-admin"];
