const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const accountDetailSchema = new Schema({
  AccountName: {
    type: String,
    required: [true, "provide account name"],
    trim: true,
  },
  AccountNumber: {
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

    accountDetails: { accountDetailSchema },
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
  { timestamps: true }
);

// middleware to calculate hourly fee for a single item
invoiceSchema.pre("save", function (next) {
  let totalAmount = 0;

  if (this.services.hours && this.services.feeRatePerHour) {
    this.services.amount =
      this.services[0].hours * this.services[0].feeRatePerHour;
    totalAmount += this.services[0].amount;
  }

  this.services[0].amount = totalAmount;

  next();
});

// middleware to calculate all hourly fees
// invoiceSchema.pre("save", function (next) {
//   let totalAmount = 0;

//   this.services.forEach((service) => {
//     if (service.hours && service.feeRatePerHour) {
//       service.amount = service.hours * service.feeRatePerHour;
//       totalAmount += service.amount;
//     }
//   });
//   this.totalProfessionalFees = totalAmount;
//   this.totalInvoiceAmount = totalAmount + this.previousBalance;
//   this.totalAmountDue = totalAmount + this.previousBalance - this.amountPaid;

//   next();
// });
// middleware to calculate hourly fee and total invoice amount
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

  // If there's a previous balance, add it to the total amount
  if (this.previousBalance) {
    totalAmount += this.previousBalance;
  }

  // If there's an amount unpaid, subtract it from the total amount
  if (this.amountUnpaid) {
    totalAmount -= this.amountUnpaid;
  }

  this.totalInvoiceAmount = totalAmount;

  next();
});

// calculate total hours
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
