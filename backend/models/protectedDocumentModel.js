const mongoose = require("mongoose");

const protectedDocumentSchema = new mongoose.Schema(
  {
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: [true, "Firm ID is required"],
      index: true,
    },
    documentName: {
      type: String,
      required: [true, "Document name is required"],
      trim: true,
    },
    entityType: {
      type: String,
      default: "other",
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    protectedDocument: {
      originalFileUrl: String,
      watermarkedFileUrl: String,
      thumbnailUrl: String,
      balanceAmount: {
        type: Number,
        default: 0,
      },
      notes: String,
      isBalancePaid: {
        type: Boolean,
        default: false,
      },
      uploadedAt: Date,
      paymentConfirmedAt: Date,
      paymentConfirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

protectedDocumentSchema.index({ firmId: 1, isDeleted: 1 });
protectedDocumentSchema.index({ firmId: 1, "protectedDocument.isBalancePaid": 1 });

const ProtectedDocument = mongoose.model("ProtectedDocument", protectedDocumentSchema);

module.exports = ProtectedDocument;
