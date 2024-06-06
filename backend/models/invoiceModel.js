const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const accountDetailSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: [true, "provide account name"],
    trim: true,
  },
  accountNumber: {
    type: String,
    required: [true, "provide account number"],
    trim: true,
  },
  bank: {
    type: String,
    required: [true, "provide bank name"],
    trim: true,
  },
  reference: String,
});

const invoiceSchema = new Schema(
  {
    case: {
      type: Schema.Types.ObjectId,
      ref: "Case",
    },

    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    workTitle: {
      type: String,
      maxlength: [50, "title should not be more that 50 character"],
    },

    invoiceReference: String,
    services: [
      {
        serviceDescriptions: {
          type: String,
          required: [true, "Specify work done"],
          trim: true,
        },

        hours: { type: Number, default: 0 },
        date: {
          type: Date,
          default: Date.now,
        },
        feeRatePerHour: {
          type: Number,
          default: 0,
        },
        amount: {
          type: Number,
        },
      },
    ],

    dueDate: {
      type: Date,
      required: true,
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

    totalHours: { type: Number, default: 0 },
    totalProfessionalFees: { type: Number, default: 0 },
    previousBalance: { type: Number, default: 0 },
    totalAmountDue: { type: Number, default: 0 },
    totalInvoiceAmount: { type: Number, default: 0 },

    amountPaid: { type: Number, default: 0 },

    signature: String, //image
    //   payments: [{
    //     type: Schema.Types.ObjectId,
    //     ref: 'Payment'
    //   }]
  },
  { timestamps: true },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// populate middleware
invoiceSchema.pre(/^find/, function (next) {
  this.populate({
    path: "client",
    select: "-active -dob",
  }).populate({
    path: "case",
    select: "firstParty.name.name secondParty.name.name ",
  });
  next();
});

// reference generator for invoiceReference
invoiceSchema.pre("save", function (next) {
  if (!this.isNew) {
    //isNew: check if doc is being saved for the first time
    next();
    return;
  }

  this.invoiceReference = "INV-" + new Date().getTime();
  next();
});

// Middleware to calculate fees and total invoice amounts
invoiceSchema.pre("save", function (next) {
  let totalAmount = 0;

  this.services.forEach((service) => {
    if (service.hours && service.feeRatePerHour) {
      service.amount = service.hours * service.feeRatePerHour;
    }
    if (service.amount) {
      totalAmount += service.amount;
    }
  });

  // Middleware to Calculate total professional fees
  this.totalProfessionalFees = totalAmount;

  // If there's a previous balance owed, add it to the total amount
  if (this.previousBalance) {
    totalAmount += this.previousBalance;
  }

  // If there's an amount paid/initial payment, subtract it from the total amount
  if (this.amountPaid) {
    totalAmount -= this.amountPaid;
  }

  this.totalInvoiceAmount = totalAmount;

  // Calculate the amount overdue
  this.totalAmountDue = totalAmount;

  next();
});

// Middleware to calculate total hours
invoiceSchema.pre("save", function (next) {
  let jobHours = 0;

  this.services.forEach((service) => {
    jobHours += service.hours;
  });
  this.totalHours = jobHours;
  next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
