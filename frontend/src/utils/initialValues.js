export const invoiceInitialValue = {
  case: null,
  client: "",
  workTitle: "",
  invoiceReference: "", // Added invoice reference
  services: [
    {
      serviceDescriptions: "",
      hours: 0,
      date: null,
      feeRatePerHour: 0,
      amount: 0,
    },
  ],
  expenses: [
    // Added expenses array
    {
      description: "",
      amount: 0,
      date: null,
    },
  ],
  dueDate: null,
  accountDetails: {
    accountName: "",
    accountNumber: "",
    bank: "",
    reference: "",
  },
  status: "unpaid",
  paymentInstructionTAndC: "",
  taxType: "",
  taxRate: 0.0,
  taxAmount: 0.0,
  totalAmountWithTax: 0.0,
  totalExpenses: 0,
  totalHours: 0,
  totalProfessionalFees: 0,
  previousBalance: 0,
  totalAmountDue: 0,
  totalInvoiceAmount: 0,
  amountPaid: 0,
};

export const paymentInitialValue = {
  invoiceId: null,
  clientId: null,
  caseId: null,
  totalAmountDue: 0,
  amountPaid: 0,
  date: null,
  method: "",
};

export const caseInitialValue = {
  firstParty: {
    description: "",
    name: [],
    processesFiled: [],
  },
  secondParty: {
    description: "",
    name: [],
    processesFiled: [],
  },
  otherParty: [
    {
      description: "",
      name: [],
      processesFiled: [],
    },
  ],
  suitNo: "",
  caseOfficeFileNo: "",
  courtName: "",
  courtNo: "",
  location: "",
  otherCourt: "",
  judge: [],
  caseSummary: "",
  caseStatus: "",
  natureOfCase: "",
  category: "",
  isFiledByTheOffice: false,
  filingDate: "",
  modeOfCommencement: "",
  otherModeOfCommencement: "",
  caseStrengths: [],
  caseWeaknesses: [],
  casePriority: "",
  stepToBeTaken: [],
  caseUpdates: [],

  accountOfficer: [],
  client: [],
  generalComment: "",
};

export const addUserInitValue = {
  firstName: "",
  lastName: "",
  middleName: "",
  email: "",
  password: "",
  passwordConfirm: "",
  gender: "",
  address: "",
  bio: "",
  role: "",
  position: "",
  annualLeaveEntitled: "",
  phone: "",
  yearOfCall: "",
  otherPosition: "",
  practiceArea: "",
  universityAttended: "",
  lawSchoolAttended: "",
};
