// models/paymentModel.js - Single source of truth
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentSchema = new Schema(
  {
    firmId: {
      type: Schema.Types.ObjectId,
      ref: "Firm",
      required: true,
      index: true,
    },

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
    },
    matter: {
      type: Schema.Types.ObjectId,
      ref: "Matter",
    },
    otherActivity: {
      type: String,
      trim: true,
      maxlength: 200,
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

paymentSchema.index({ invoice: 1 });
paymentSchema.index({ client: 1 });
paymentSchema.index({ case: 1 });
paymentSchema.index({ matter: 1 });
paymentSchema.index({ paymentDate: -1 });

paymentSchema.virtual("paymentReference").get(function () {
  return `PAY-${this.paymentDate.getTime().toString(36).toUpperCase()}-${this._id.toString().slice(-6).toUpperCase()}`;
});

paymentSchema.pre("save", async function (next) {
  const Invoice = mongoose.model("Invoice");
  const invoice = await Invoice.findById(this.invoice);

  if (!invoice) {
    return next(new Error("Invalid invoice reference"));
  }

  if (this.status === "completed" && this.amount > invoice.balance) {
    return next(new Error("Payment exceeds remaining balance"));
  }

  if (invoice.client.toString() !== this.client.toString()) {
    return next(new Error("Payment client does not match invoice client"));
  }

  if (this.case && invoice.case && invoice.case.toString() !== this.case.toString()) {
    return next(new Error("Payment case does not match invoice case"));
  }

  if (this.matter && invoice.matter && invoice.matter.toString() !== this.matter.toString()) {
    return next(new Error("Payment matter does not match invoice matter"));
  }

  if (this.otherActivity && invoice.otherActivity && invoice.otherActivity !== invoice.otherActivity) {
    return next(new Error("Payment other activity does not match invoice other activity"));
  }

  // Data integrity: Ensure either matter OR otherActivity is set, not both
  if (this.matter && this.otherActivity) {
    this.matter = undefined; // Clear matter if otherActivity is set
  }

  next();
});

module.exports = mongoose.model("Payment", paymentSchema);
