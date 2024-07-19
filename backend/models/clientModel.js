const mongoose = require("mongoose");
const validator = require("validator");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

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
    password: {
      type: String,
      trim: true,
      select: false,
      required: [true, "You must provide a password"],
      minLength: [6, "Password must have at least 6 character"],
      maxLength: [15, "Password must not be more than 15 character"],
    },

    passwordConfirm: {
      type: String,
      trim: true,
      required: [true, "Please confirm your password"],
      validate: {
        //only work on CREATE and SAVE
        validator: function (el) {
          return el === this.password; //returns a boolean
        },
        message: `Passwords are not the same`,
      },
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
    role: {
      type: String,
      enum: {
        values: ["user", "super-admin", "admin", "secretary", "hr", "client"],
        message: "Select a valid role.",
      },
      default: "client",
    },
    address: {
      type: String,
      required: [true, "Provide client's address"],
      trim: true,
    },
    case: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Case",
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },

    passwordChangedAt: {
      type: Date,
      // required: true,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
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
    select: "firstParty.name.name secondParty.name.name caseStatus reports",
  });
  next();
});

/**
 * IMPLEMENTING ENCRYPTION/HASHING OF PASSWORD FOR SECURITY
 */
clientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});

//need more explanation on this. This is for password Reset
clientSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; //-1000 ensure pwd is created after token has been changed
  next();
});

//QUERY MIDDLEWARE

clientSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

clientSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword.toString(), userPassword);
};

// voluntary password change by user
clientSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

//INSTANCE METHOD
clientSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // console.log(this.passwordResetExpire);
  return resetToken;
};

const Client = mongoose.model("Client", clientSchema);

module.exports = Client;
