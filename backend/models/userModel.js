const crypto = require("crypto");
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
      required: function () {
        return this.role !== "client";
      },
    },

    secondName: {
      type: String,
      trim: true,
      // required: function(){
      //   return this.role === "client"
      // },
    },

    middleName: String,

    email: {
      type: String,
      trim: true,
      unique: [true, "The email address is taken."],
      lowercase: true,
      required: [true, "a user must provide an email"],
      validate: [validator.isEmail, "Please, provide a valid email address"], //third party validator
    },

    password: {
      type: String,
      trim: true,
      select: false,
      required: [true, "You must provide a password"],
      minLength: [8, "Password must have at least 8 characters"],
      validate: {
        validator: function (value) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
            value
          );
        },
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      },
    },
    passwordConfirm: {
      type: String,
      trim: true,
      required: [true, "Please confirm your password"],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords are not the same",
      },
    },

    photo: {
      type: String,
      default:
        "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?t=st=1722072885~exp=1722076485~hmac=fad6e85b55559cb0eff906e5e75cc3ce337bce7edda8da18f4ccdcb02a7442ad&w=740",
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: function () {
        return this.role !== "client";
      },
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
        values: ["user", "super-admin", "admin", "secretary", "hr", "client"],
        message: "Select a valid role.",
      },
      default: "user",
    },

    position: {
      type: String,
      trim: true,
      required: function () {
        return this.role !== "client";
      },
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
        "Other",
      ],

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

    isLawyer: {
      type: Boolean,
      default: false,
      required: true,
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
      default: "+234",
    },

    practiceArea: {
      type: String,
      required: function () {
        return this.isLawyer === true;
      },
    },
    lawSchoolAttended: {
      type: String,
      required: function () {
        return this.isLawyer === true;
      },
    },
    universityAttended: {
      type: String,
      required: function () {
        return this.role !== "client";
      },
    },
    yearOfCall: {
      type: Date,
      required: function () {
        return this.isLawyer === true;
      },
      max: Date.now,
    },

    // clientCase: [
    //   {
    //     type: mongoose.Schema.ObjectId,
    //     ref: "Case",
    //     // required:function() {
    //     //   return this.role === "client"
    //     // }
    //   },
    // ],

    isVerified: {
      type: Boolean,
      default: false,
    },

    userAgent: {
      type: Array,
      required: true,
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    minimize: false,
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
  //   {
  //     timestamps: true,
  //   }
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
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.createPasswordResetToken = function () {
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

// function to check if password was changed
// If the user changed their password after the time represented by 1605105300, the method would return true.
// If the user has not changed their password since that time, the method would return false
userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
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

const User = mongoose.model("User", userSchema);

module.exports = User;
