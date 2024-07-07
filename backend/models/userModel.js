const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: [true, "A user must provide first Name"],
    },
    lastName: {
      type: String,
      trim: true,
      required: [true, "A user must provide first name"],
    },
    middleName: String,
    email: {
      type: String,
      trim: true,
      unique: [true, "The email address is taken."],
      lowercase: true,
      required: [true, "a user must provide an email"],
      validate: [validator.isEmail, "Please, provide a valid email address"],
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
        validator: function (el) {
          return el === this.password;
        },
        message: `Passwords are not the same`,
      },
    },
    googleId: {
      type: String,
      unique: true,
    },
    googleRefreshToken: {
      type: String,
      select: false,
    },
    photo: String,
    gender: {
      type: String,
      enum: ["male", "female"],
      required: [true, "Please select your gender"],
    },
    address: {
      type: String,
      trim: true,
      required: [true, "Please provide your residential address"],
    },
    role: {
      type: String,
      trim: true,
      enum: {
        values: ["user", "super-admin", "admin", "secretary", "hr"],
        message: "Select a valid role.",
      },
      default: "user",
    },
    position: {
      type: String,
      trim: true,
      required: true,
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
      validate: (value) => {
        if (
          !value.match(
            /^(Principal|Managing Partner|Head of Chambers|Associate|Senior Associate|Junior Associate|Counsel|Intern|Secretary|Para-legal|Client|Other)$/
          )
        ) {
          return "Invalid position. Please select a valid option from the list.";
        }
      },
    },
    otherPosition: String,
    bio: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      required: [true, "Please provide your phone number"],
    },
    practiceArea: String,
    universityAttended: String,
    lawSchoolAttended: String,
    annualLeaveEntitled: Number,
    yearOfCall: {
      type: Date,
      required: function () {
        return ["Secretary", "Para-legal", "Other", "Client"].includes(
          this.position
        );
      },
      max: Date.now,
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// virtual populate for tasks
userSchema.virtual("task", {
  ref: "Task",
  foreignField: "assignedTo",
  localField: "_id",
});
userSchema.virtual("case", {
  ref: "Task",
  foreignField: "caseToWorkOn",
  localField: "_id",
});

// virtuals for user full Name
userSchema.virtual("fullName").get(function () {
  if (this.middleName) {
    return this.firstName + " " + this.lastName + " " + this.middleName;
  } else {
    return this.firstName + " " + this.lastName;
  }
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const convertToTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < convertToTimeStamp;
  }
  return false;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
