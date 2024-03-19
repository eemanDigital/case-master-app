const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "A user must provide first Name"],
    },
    lastName: {
      type: String,
      required: [true, "A user must provide first name"],
    },
    middleName: String,

    email: {
      type: String,
      unique: [true, 'The email address is taken.'],
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
      required: [true, "user's position must be provided"],
      enum: [
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
        "Client",
        "Other",
      ],
      default: "Counsel",
    },

    otherPosition: String,
    practiceArea: String,
    universityAttended: String,
    lawSchoolAttended: String,

    yearOfCall: {
      type: Date,
      // required: null,
      required: function () {
        return !["Secretary", "Para-legal", "Other", "Client"].includes(
          this.position
        );
      },
    },
  },

  {
    timestamps: true,
  }
);

//password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  /**
   * we set passwordConfirm to undefined to delete it
   *   after validation
   * we don't want it persisted to the db
   * it is only needed for validation
   */
  this.passwordConfirm = undefined;
  next();
});

// userSchema.pre("save", function (next) {
//   // Check if the position is not one of the specified roles
//   if (!["Secretary", "Para-legal", "Other", "Client"].includes(this.position)) {
//     // If it's not one of the specified roles, set yearOfCall to required
//     this.schema.path("yearOfCall").required(false);
//   } else {
//     // Otherwise, remove the requirement for yearOfCall
//     this.schema.path("yearOfCall").required(true);
//   }

//   next();
// });

const User = mongoose.model("User", userSchema);

module.exports = User;
