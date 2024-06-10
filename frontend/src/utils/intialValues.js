export const invoiceInitialValue = {
  case: null,
  client: "",
  workTitle: "",
  services: [
    {
      serviceDescriptions: "",
      hours: 0,
      date: null,
      feeRatePerHour: 0,
      amount: 0,
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
  previousBalance: 0,
  amountPaid: 0,
};
