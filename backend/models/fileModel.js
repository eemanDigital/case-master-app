const mongoose = require("mongoose");

const fileSchema = mongoose.Schema({
  fileName: {
    type: String,
    trim: true,
    maxLength: [20, "file name can not be more than 20 characters"],
  },

  file: {
    type: String,
    required: [true, "Please, select a file"],
  },

  date: {
    type: Date,
    default: Date.now,
  },
});

const File = mongoose.model("File", fileSchema);

fileSchema.pre("/^find", function (next) {
  this.populate({
    path: "case",
    select: "firstParty.name.name  secondParty.name.name",
  });
  next();
});

// fileSchema.pre("/^find", function (next) {
//   this.populate({
//     path: "task",
//     select: "title",
//   });
//   next();
// });

module.exports = File;
