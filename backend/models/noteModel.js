const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  firmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Firm",
    required: true,
    index: true,
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "A note must belong to a user"],
    index: true,
  },

  title: {
    type: String,
    required: [true, "A note must have a title"],
    maxlength: [100, "Title cannot exceed 100 characters"],
    trim: true,
  },

  content: {
    type: String,
    required: [true, "A note must have content"],
  },

  category: {
    type: String,
    enum: ["case-notes", "legal-research", "client-info", "court-ruling", "procedure", "general"],
    default: "general",
    index: true,
  },

  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],

  isPinned: {
    type: Boolean,
    default: false,
    index: true,
  },

  isFavorite: {
    type: Boolean,
    default: false,
    index: true,
  },

  color: {
    type: String,
    default: "#ffffff",
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: "Invalid color format",
    },
  },

  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },

  deletedAt: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

noteSchema.index({ title: "text", content: "text", tags: "text" });

noteSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

noteSchema.virtual("wordCount").get(function() {
  if (!this.content) return 0;
  return this.content.replace(/<[^>]*>/g, "").split(/\s+/).filter(word => word.length > 0).length;
});

const Note = mongoose.model("Note", noteSchema);

module.exports = Note;
