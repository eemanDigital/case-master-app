const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["read", "unread"],
      default: "unread",
    },
    relatedTask: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// notificationSchema.pre(/^find/, function (next) {
//   this.populate({ path: "sender", select: "firstName lastName" })
//     // .populate({
//     //   path: "recipient",
//     //   select: "firstName lastName",
//     // })
//     .populate("relatedTask");
//   next();
// });
const Notice = mongoose.model("Notice", notificationSchema);

module.exports = Notice;
