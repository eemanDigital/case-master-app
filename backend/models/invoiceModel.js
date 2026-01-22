// models/invoiceModel.js

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
  fixedAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
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
    firmId: {
      type: Schema.Types.ObjectId,
      ref: "Firm",
      required: true,
      index: true, // ✅ Add index for performance
    },
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
    title: {
      type: String,
      required: [true, "Invoice title is required"],
      maxlength: 100,
    },
    description: String,
    billingPeriodStart: Date,
    billingPeriodEnd: Date,
    services: [serviceSchema],
    expenses: [expenseSchema],
    payments: [paymentSchema],
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
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
    previousBalance: {
      type: Number,
      default: 0,
    },
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
    paymentTerms: String,
    notes: String,
    internalNotes: String,
    matterReference: String,
    timekeeper: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    billingAttorney: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedBy: {
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

// ✅ Virtuals
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

// ✅ Pre-validate hook for firm-specific invoice number
invoiceSchema.pre("validate", async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    this.invoiceNumber = await this.constructor.generateInvoiceNumber(
      this.firmId
    );
  }
  next();
});

// ✅ Pre-save middleware
invoiceSchema.pre("save", function (next) {
  // Calculate service amounts
  this.services.forEach((service) => {
    switch (service.billingMethod) {
      case "hourly":
        service.amount =
          service.hours > 0
            ? service.hours * service.rate
            : service.fixedAmount > 0
            ? service.fixedAmount
            : 0;
        break;
      case "fixed_fee":
        service.amount = service.fixedAmount;
        break;
      case "item":
        service.amount = service.quantity * service.unitPrice;
        break;
      case "contingency":
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

  this.subtotal = servicesTotal + expensesTotal + (this.previousBalance || 0);

  // Apply discount
  let discountAmount = 0;
  if (this.discount && this.discount > 0) {
    if (this.discountType === "percentage") {
      discountAmount = this.subtotal * (this.discount / 100);
    } else if (this.discountType === "fixed" || this.discountType === "none") {
      discountAmount = this.discount;
      if (this.discountType === "none" && this.discount > 0) {
        this.discountType = "fixed";
      }
    }
    discountAmount = Math.min(discountAmount, this.subtotal);
  }

  const taxableAmount = Math.max(0, this.subtotal - discountAmount);
  this.taxAmount = taxableAmount * ((this.taxRate || 0) / 100);
  this.total = taxableAmount + this.taxAmount;
  this.balance = Math.max(0, this.total - (this.amountPaid || 0));

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

// ✅ Static methods with firm isolation
invoiceSchema.statics.generateInvoiceNumber = async function (firmId) {
  const firm = await mongoose.model("Firm").findById(firmId);
  const firmPrefix = firm?.invoicePrefix || "INV";
  const year = new Date().getFullYear();

  const count = await this.countDocuments({
    firmId,
    createdAt: {
      $gte: new Date(`${year}-01-01`),
      $lt: new Date(`${year + 1}-01-01`),
    },
  });

  return `${firmPrefix}-${year}-${(count + 1).toString().padStart(4, "0")}`;
};

// ✅ Instance methods
invoiceSchema.methods.addPayment = async function (paymentData) {
  const Payment = mongoose.model("Payment");

  const payment = new Payment({
    ...paymentData,
    firmId: this.firmId,
    invoice: this._id,
    client: this.client,
    case: this.case,
  });

  await payment.save();

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

// ✅ Soft delete method
invoiceSchema.methods.softDelete = function (deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// ✅ Indexes for multi-tenant performance
invoiceSchema.index({ firmId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ firmId: 1, client: 1, status: 1 });
invoiceSchema.index({ firmId: 1, dueDate: 1 });
invoiceSchema.index({ firmId: 1, status: 1, dueDate: 1 });
invoiceSchema.index({ firmId: 1, isDeleted: 1 });
invoiceSchema.index({ firmId: 1, case: 1 });
invoiceSchema.index({ firmId: 1, createdBy: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
