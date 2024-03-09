const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "A user must provide first Name"],
  },

  lastName: {
    type: String,
    required: [true, "A user must provide first name"],
  },
  firstName: {
    type: String,
    required: [true, "A user must provide last name"],
  },
  middleName: String,
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: [true, "a user must provide an email"],
    validate: [validator.isEmail, "Please, provide a valid email address"], //third party validator
  },
  password: {
    type: String,
    required: [true, "You must provide a password"],
    minLength: [6, "Password must have at least 6 character"],
    maxLength: [15, "Password must not be more than 15 character"],
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      //only work on CREATE and SAVE
      validator: function (el) {
        return el === this.password; //returns a boolean
      },
      message: `Passwords are not the same`,
    },
  },
  photo: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["user", "admin", "secretary"],
    default: "user",
  },
  position: {
    type: String,
    required: [true, "user's position must be set"],
    enum: {
      values: [
        "Principal",
        "Managing Partner",
        "Head of Chambers",
        "Associate",
        "Senior Associate",
        "Junior Associate",
        "Counsel",
        "Intern",
        "Secretary",
        "Para-legal",
        "other",
      ],
      message: "specify any of the options",
    },
  },
  otherPosition: String,
  yearOfCall: {
    type: Date,
    required: true,
    default: Date.now,
  },
  practiceArea: String,
  universityAttended: String,
  lawSchoolAttended: String,
});

const User = mongoose.model("User", userSchema);

module.exports = User;
