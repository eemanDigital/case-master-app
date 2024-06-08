const mongoose = require("mongoose");
const validator = require("validator");

const clientSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: [true, "Provide a firstName"],
    },
    secondName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      lowercase: true,
      required: [true, "A client must provide an email"],
      validate: [validator.isEmail, "Please, provide a valid email address"], //third party validator
    },
    phone: {
      type: String,
      trim: true,
      required: [true, "Provide a phone number"],
      // validate: [
      //   validator.isMobilePhone,
      //   "Please, provide a valid phone number",
      // ],
    },
    dob: {
      type: Date,
      // required: [true, "Provide a date of birth"],
    },
    address: {
      type: String,
      required: [true, "Provide client's address"],
      trim: true,
    },
    case: {
      type: mongoose.Schema.ObjectId,
      ref: "Case",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// virtual for client's full Name
clientSchema.virtual("fullName").get(function () {
  return this.firstName + " " + this.secondName;
});

clientSchema.pre(/^find/, function (next) {
  this.populate({
    path: "case",
    select: "firstParty.name.name secondParty.name.name ",
  });
  next();
});

const Client = mongoose.model("Client", clientSchema);

module.exports = Client;
