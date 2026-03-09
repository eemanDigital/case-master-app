const mongoose = require("mongoose");

const placeholderSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["text", "date", "number", "currency", "textarea", "select"],
      default: "text",
    },
    required: {
      type: Boolean,
      default: true,
    },
    defaultValue: String,
    options: [String],
    hint: String,
  },
  { _id: false },
);

const changelogSchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true,
    },
    changes: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: false },
);

const courtDetailsSchema = new mongoose.Schema(
  {
    applicableCourts: [String],
    documentType: String,
    filingFee: Number,
    jurisdiction: {
      type: String,
      enum: ["state", "federal", "both"],
    },
  },
  { _id: false },
);

const templateSchema = new mongoose.Schema(
  {
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      index: true,
    },
    title: {
      type: String,
      required: [true, "Template title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: {
      type: String,
      enum: [
        "contract",
        "court-process",
        "correspondence",
        "corporate",
        "conveyancing",
        "custom",
      ],
      required: [true, "Template category is required"],
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    practiceArea: {
      type: String,
      enum: [
        "corporate-commercial",
        "litigation",
        "property-conveyancing",
        "employment-labour",
        "family",
        "intellectual-property",
        "banking-finance",
        "oil-gas",
        "tax",
        "criminal",
        "general",
      ],
      index: true,
    },
    content: {
      type: String,
      required: [true, "Template content is required"],
    },
    placeholders: [placeholderSchema],
    isSystemTemplate: {
      type: Boolean,
      default: false,
      index: true,
    },
    courtDetails: courtDetailsSchema,
    tags: [String],
    language: {
      type: String,
      default: "en",
    },
    jurisdiction: {
      type: String,
      default: "Nigeria",
    },
    governingLaw: {
      type: String,
      trim: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsedAt: Date,
    version: {
      type: String,
      default: "1.0",
    },
    changelog: [changelogSchema],
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

templateSchema.index({ firmId: 1, category: 1 });
templateSchema.index({ firmId: 1, status: 1 });
templateSchema.index({ tags: 1 });

templateSchema.pre("save", function (next) {
  if (this.isModified("title") && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

templateSchema.statics.extractPlaceholders = function (content) {
  const placeholderRegex = /\{\{([A-Z_][A-Z0-9_]*)\}\}/g;
  const placeholders = new Set();
  let match;

  while ((match = placeholderRegex.exec(content)) !== null) {
    placeholders.add(match[1]);
  }

  return Array.from(placeholders).map((key) => ({
    key,
    label: key.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
    type: "text",
    required: true,
  }));
};

templateSchema.statics.getSystemTemplates = async function (category, practiceArea) {
  const query = { isSystemTemplate: true, isDeleted: false };
  if (category) query.category = category;
  if (practiceArea) query.practiceArea = practiceArea;

  return this.find(query).sort({ title: 1 });
};

templateSchema.statics.getFirmTemplates = async function (firmId, category) {
  const query = { firmId, isSystemTemplate: false, isDeleted: false };
  if (category) query.category = category;

  return this.find(query).sort({ title: 1 });
};

templateSchema.methods.incrementUsage = async function () {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  await this.save();
};

templateSchema.methods.generateDocument = function (data) {
  let content = this.content;

  this.placeholders.forEach((placeholder) => {
    const value = data[placeholder.key] || "";
    const regex = new RegExp(`\\{\\{${placeholder.key}\\}\\}`, "g");
    content = content.replace(regex, value);
  });

  return content;
};

const Template = mongoose.model("Template", templateSchema);

module.exports = Template;
