const mongoose = require("mongoose");
const validator = require("validator");
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
    select: "firstParty.name.name secondParty.name.name ",
  });
  next();
});

clientSchema.methods.correctPassword = async function (
  candidatePassword,
  clientPassword
) {
  return await bcrypt.compare(candidatePassword, clientPassword);
};

clientSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

clientSchema.methods.createPasswordResetToken = function () {
  //generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  //encrypt the reset token and save in the db
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //expires in 10m

  return resetToken;
};

//password hashing middleware
clientSchema.pre("save", async function (next) {
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

// function to check if password was changed
// If the client changed their password after the time represented by 1605105300, the method would return true.
// If the client has not changed their password since that time, the method would return false
clientSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    // we need to convert our passwordChangedAt to normal timestamp
    const convertToTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //means the date the jwt was issued is less than the changed timestamp
    return JWTTimestamp < convertToTimeStamp; //100 < 200
  }
  //false means pwd not changed
  return false;
};

const Client = mongoose.model("Client", clientSchema);

module.exports = Client;
