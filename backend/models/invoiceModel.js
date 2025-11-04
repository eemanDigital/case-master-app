const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
  description: {
    type: String,
    required: [true, "Service description is required"],
    trim: true,
  },
  billingMethod: {
    type: String,
    enum: ["hourly", "fixed_fee", "contingency", "retainer", "item"],
    required: true,
    default: "hourly",
  },
  // For hourly billing
  hours: {
    type: Number,
    default: 0,
    min: 0,
  },
  rate: {
    type: Number,
    default: 0,
    min: 0,
  },
  // For fixed fee billing
  fixedAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  // For item-based billing (court appearances, document prep, etc.)
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  unitPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Calculated amount (auto-calculated)
  amount: {
    type: Number,
    default: 0,
    min: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: String,
    enum: [
      "consultation",
      "court_appearance",
      "document_preparation",
      "research",
      "negotiation",
      "filing",
      "other",
    ],
    default: "other",
  },
});

const expenseSchema = new Schema({
  description: {
    type: String,
    required: [true, "Expense description is required"],
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: String,
    enum: [
      "court_fees",
      "filing_fees",
      "travel",
      "accommodation",
      "expert_witness",
      "process_server",
      "printing",
      "other",
    ],
    default: "other",
  },
  receiptNumber: String,
  isReimbursable: {
    type: Boolean,
    default: true,
  },
});

const paymentSchema = new Schema({
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "bank_transfer", "cheque", "card", "other"],
    required: true,
  },
  reference: String,
  notes: String,
  status: {
    type: String,
    enum: ["completed", "pending", "failed"],
    default: "completed",
  },
});

const invoiceSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    case: {
      type: Schema.Types.ObjectId,
      ref: "Case",
    },

    // Basic Info
    title: {
      type: String,
      required: [true, "Invoice title is required"],
      maxlength: 100,
    },
    description: String,

    // Billing Period (for retainer/hourly invoices)
    billingPeriodStart: Date,
    billingPeriodEnd: Date,

    // Line Items
    services: [serviceSchema],
    expenses: [expenseSchema],
    payments: [paymentSchema],

    // Dates
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },

    // Financial Summary
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed", "none"],
      default: "none",
    },
    discountReason: String,

    // Tax Configuration
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Final Amounts
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Previous Balance (for matters with ongoing billing)
    previousBalance: {
      type: Number,
      default: 0,
    },

    // Status & Metadata
    status: {
      type: String,
      enum: [
        "draft",
        "sent",
        "paid",
        "overdue",
        "partially_paid",
        "cancelled",
        "void",
      ],
      default: "draft",
    },

    // Payment Instructions
    paymentTerms: String,
    notes: String,
    internalNotes: String, // For law firm internal use

    // Legal Specific Fields
    matterReference: String,
    timekeeper: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    billingAttorney: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
invoiceSchema.virtual("isOverdue").get(function () {
  return (
    (this.status === "sent" || this.status === "partially_paid") &&
    this.dueDate < new Date() &&
    this.balance > 0
  );
});

invoiceSchema.virtual("paymentProgress").get(function () {
  return this.total > 0 ? (this.amountPaid / this.total) * 100 : 0;
});

invoiceSchema.virtual("daysOverdue").get(function () {
  if (!this.isOverdue) return 0;
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  return Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
});

// Pre-validate hook for invoice number
invoiceSchema.pre("validate", async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    this.invoiceNumber = await this.constructor.generateInvoiceNumber();
  }
  next();
});

// Pre-save middleware for comprehensive calculations
invoiceSchema.pre("save", function (next) {
  // Calculate service amounts based on billing method
  this.services.forEach((service) => {
    switch (service.billingMethod) {
      case "hourly":
        service.amount = service.hours * service.rate;
        break;
      case "fixed_fee":
        service.amount = service.fixedAmount;
        break;
      case "item":
        service.amount = service.quantity * service.unitPrice;
        break;
      case "contingency":
        // Contingency fees are usually calculated separately
        service.amount = service.fixedAmount || 0;
        break;
      case "retainer":
        service.amount = service.fixedAmount || 0;
        break;
    }
  });

  // Calculate totals
  const servicesTotal = this.services.reduce(
    (sum, service) => sum + (service.amount || 0),
    0
  );
  const expensesTotal = this.expenses.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0
  );

  // Calculate subtotal (services + expenses + previous balance)
  this.subtotal = servicesTotal + expensesTotal + (this.previousBalance || 0);

  // Apply discount
  let discountAmount = 0;
  if (this.discountType === "percentage" && this.discount > 0) {
    discountAmount = this.subtotal * (this.discount / 100);
  } else if (this.discountType === "fixed" && this.discount > 0) {
    discountAmount = this.discount;
  }

  // Calculate taxable amount (after discount)
  const taxableAmount = Math.max(0, this.subtotal - discountAmount);

  // Calculate tax
  this.taxAmount = taxableAmount * ((this.taxRate || 0) / 100);

  // Calculate final total
  this.total = taxableAmount + this.taxAmount;

  // Calculate total paid from payments array
  this.amountPaid = this.payments
    .filter((payment) => payment.status === "completed")
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

  // Calculate balance
  this.balance = Math.max(0, this.total - this.amountPaid);

  // Auto-update status
  if (
    this.status !== "draft" &&
    this.status !== "cancelled" &&
    this.status !== "void"
  ) {
    if (this.balance <= 0 && this.total > 0) {
      this.status = "paid";
    } else if (this.amountPaid > 0) {
      if (this.isOverdue) {
        this.status = "overdue";
      } else {
        this.status = "partially_paid";
      }
    } else {
      if (this.isOverdue) {
        this.status = "overdue";
      } else if (this.issueDate) {
        this.status = "sent";
      }
    }
  }

  next();
});

// Static methods
invoiceSchema.statics.generateInvoiceNumber = async function () {
  const count = await this.countDocuments();
  const year = new Date().getFullYear();
  return `INV-${year}-${(count + 1).toString().padStart(4, "0")}`;
};

// Instance methods
invoiceSchema.methods.addPayment = async function (paymentData) {
  const Payment = mongoose.model("Payment");

  const payment = new Payment({
    ...paymentData,
    invoice: this._id,
    client: this.client,
    case: this.case,
  });

  await payment.save();

  // Add to payments array and recalculate
  this.payments.push(payment);
  await this.save();

  return payment;
};

invoiceSchema.methods.addService = function (serviceData) {
  this.services.push(serviceData);
  return this.save();
};

invoiceSchema.methods.addExpense = function (expenseData) {
  this.expenses.push(expenseData);
  return this.save();
};

invoiceSchema.methods.applyDiscount = function (
  discount,
  type = "fixed",
  reason = ""
) {
  this.discount = discount;
  this.discountType = type;
  this.discountReason = reason;
  return this.save();
};

// Indexes for performance
invoiceSchema.index({ client: 1, status: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ issueDate: 1 });
invoiceSchema.index({ timekeeper: 1 });
invoiceSchema.index({ status: 1, dueDate: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
