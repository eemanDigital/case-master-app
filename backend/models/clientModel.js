const mongoose = require("mongoose");
const validator = require("validator");

const clientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
    required: [true, "Provide a firstName"],
  },
  secondName: {
    type: String,
    trim: true,
    required: [true, "Provide a secondName"],
  },
  middleName: String,
  email: {
    type: String,
    trim: true,
    unique: true,
    lowercase: true,
    required: [true, "a user must provide an email"],
    validate: [validator.isEmail, "Please, provide a valid email address"], //third party validator
  },

  case: {
    type: mongoose.Schema.ObjectId,
    ref: "Case",
  },
});

const Client = mongoose.model("Client", clientSchema);

module.exports = Client;
