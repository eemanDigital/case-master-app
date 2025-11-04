// models/paymentModel.js - Single source of truth
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentSchema = new Schema(
  {
    invoice: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
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
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    method: {
      type: String,
      enum: ["credit_card", "bank_transfer", "cash", "cheque", "other"],
      required: true,
    },
    reference: String,
    notes: String,
    status: {
      type: String,
      enum: ["completed", "pending", "failed", "refunded"],
      default: "completed",
    },
    // For reconciliation
    transactionId: String,
    processedBy: {
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

// Indexes for performance
paymentSchema.index({ invoice: 1 });
paymentSchema.index({ client: 1 });
paymentSchema.index({ case: 1 });
paymentSchema.index({ paymentDate: -1 });

// Virtual for formatted payment reference
paymentSchema.virtual("paymentReference").get(function () {
  return `PAY-${this.paymentDate.getTime()}-${this._id.toString().slice(-6)}`;
});

// Pre-save middleware for data validation
paymentSchema.pre("save", async function (next) {
  // Validate that invoice, client, and case relationships are consistent
  const Invoice = mongoose.model("Invoice");
  const invoice = await Invoice.findById(this.invoice)
    .populate("client")
    .populate("case");

  if (!invoice) {
    throw new Error("Invalid invoice reference");
  }

  // paymentSchema.pre("save", async function (next) {

  //   // Validate that invoice, client, and case relationships are consistent
  //   const Invoice = mongoose.model("Invoice");
  //   const invoice = await Invoice.findById(this.invoice)
  //     .populate("client")
  //     .populate("case");

  //   if (!invoice) {
  //     throw new Error("Invalid invoice reference");
  //   }

  //   // Add balance validation here:
  //   if (this.amount > invoice.balance) {
  //     return next(new Error("Payment exceeds remaining balance"));
  //   }

  //   // Validate client matches invoice client
  //   if (invoice.client._id.toString() !== this.client.toString()) {
  //     throw new Error("Payment client does not match invoice client");
  //   }

  //   // Validate case matches invoice case (if invoice has a case)
  //   if (invoice.case && invoice.case._id.toString() !== this.case.toString()) {
  //     throw new Error("Payment case does not match invoice case");
  //   }

  //   next();
  // });

  paymentSchema.pre("save", async function (next) {
    const Invoice = mongoose.model("Invoice");
    const invoice = await Invoice.findById(this.invoice)
      .populate("client")
      .populate("case");

    if (!invoice) {
      throw new Error("Invalid invoice reference");
    }

    // Only validate balance for completed payments
    if (this.status === "completed" && this.amount > invoice.balance) {
      return next(new Error("Payment exceeds remaining balance"));
    }

    // Validate relationships
    if (invoice.client._id.toString() !== this.client.toString()) {
      throw new Error("Payment client does not match invoice client");
    }

    if (invoice.case && invoice.case._id.toString() !== this.case.toString()) {
      throw new Error("Payment case does not match invoice case");
    }

    next();
  });
});

module.exports = mongoose.model("Payment", paymentSchema);
