const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentSchema = new Schema(
  {
    case: {
      type: Schema.Types.ObjectId,
      ref: "Case",
      required: true,
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    amountPaid: {
      type: Number,
      required: true,
    },
    totalInvoiceAmount: {
      type: Number,
      required: true,
    },
    balance: {
      type: Number,
      required: true,
    },
    dateOfPayment: {
      type: Date,
      default: Date.now,
    },
    method: {
      type: String,
      enum: ["credit_card", "bank_transfer", "cash", "cheque"],
      required: true,
    },
    reference: {
      type: String,
      trim: true,
    },
  },

  { timestamps: true },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentSchema.pre(/^find/, function (next) {
  this.populate({
    path: "client",
    select: "firstName secondName",
  })
    .populate({
      path: "case",
      select: "firstParty.name.name secondParty.name.name ",
    })
    .populate({
      path: "invoice",
      select:
        "invoiceReference workTitle totalInvoiceAmount totalAmountDue -case -client",
    });
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);
