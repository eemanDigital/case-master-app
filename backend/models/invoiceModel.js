const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const accountDetailSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: [true, "Provide account name"],
    trim: true,
  },
  accountNumber: {
    type: String,
    required: [true, "Provide account number"],
    trim: true,
  },
  bank: {
    type: String,
    required: [true, "Provide bank name"],
    trim: true,
  },
  reference: String,
});

const serviceSchema = new Schema({
  serviceDescriptions: {
    type: String,
    required: [true, "Specify work done"],
    trim: true,
  },
  hours: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  feeRatePerHour: { type: Number, default: 0 },
  amount: { type: Number },
});

const expenseSchema = new Schema({
  description: {
    type: String,
    required: [true, "Describe the expenses"],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, "Provide amount"],
    default: 0.0,
  },
  date: { type: Date, default: Date.now },
});

const invoiceSchema = new Schema(
  {
    case: { type: Schema.Types.ObjectId, ref: "Case" },
    client: { type: Schema.Types.ObjectId, ref: "User", required: true },
    workTitle: {
      type: String,
      maxlength: [50, "Title should not be more than 50 characters"],
      required: [true, "Provide nature of work done"],
    },
    invoiceReference: String,
    services: [serviceSchema],
    expenses: [expenseSchema],
    dueDate: {
      type: Date,
      validate: {
        validator: function (v) {
          return this.status === "paid" || v != null;
        },
        message: (props) => "Due date is required when status is not paid",
      },
    },
    accountDetails: accountDetailSchema,
    status: {
      type: String,
      enum: ["paid", "unpaid", "overdue"],
      default: "unpaid",
    },
    paymentInstructionTAndC: {
      type: String,
      maxlength: [
        100,
        "Payment instruction should not be more than 100 characters",
      ],
      trim: true,
    },
    taxType: String,
    taxRate: { type: Number, default: 0.0 },
    taxAmount: { type: Number, default: 0.0 },
    totalAmountWithTax: { type: Number, default: 0.0 },
    totalExpenses: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
    totalProfessionalFees: { type: Number, default: 0 },
    previousBalance: { type: Number, default: 0 },
    totalAmountDue: { type: Number, default: 0 },
    totalInvoiceAmount: { type: Number, default: 0 }, // represents the sum total of all charges related to the invoice before any deductions
    amountPaid: { type: Number, default: 0 },
  },
  { timestamps: true },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Populate middleware
invoiceSchema.pre(/^find/, function (next) {
  this.populate({
    path: "client",
    select: "-active -dob",
  }).populate({
    path: "case",
    select: "firstParty.name.name secondParty.name.name client",
  });
  next();
});

// Reference generator for invoiceReference
invoiceSchema.pre("save", function (next) {
  if (this.isNew) {
    this.invoiceReference = "INV-" + new Date().getTime();
  }
  next();
});

// Middleware to calculate fees and total invoice amounts
invoiceSchema.pre("save", function (next) {
  let totalProfessionalFees = 0;
  this.services.forEach((service) => {
    if (service.hours && service.feeRatePerHour) {
      service.amount = service.hours * service.feeRatePerHour;
    }
    if (service.amount) {
      totalProfessionalFees += service.amount;
    }
  });
  this.totalProfessionalFees = totalProfessionalFees;

  let totalExpenses = 0;
  this.expenses.forEach((expense) => {
    totalExpenses += expense.amount;
  });
  this.totalExpenses = totalExpenses;

  // total amount
  let totalAmount =
    totalProfessionalFees + totalExpenses + (this.previousBalance || 0);
  this.taxAmount = totalAmount * (this.taxRate / 100);
  this.totalAmountWithTax = totalAmount + this.taxAmount;

  // deduct if amount paid is provided
  if (this.amountPaid) {
    totalAmount -= this.amountPaid;
  }
  this.totalInvoiceAmount = totalAmount;
  this.totalAmountDue = this.totalAmountWithTax;

  next();
});

// Middleware to calculate total hours
invoiceSchema.pre("save", function (next) {
  this.totalHours = this.services.reduce(
    (sum, service) => sum + service.hours,
    0
  );
  next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
