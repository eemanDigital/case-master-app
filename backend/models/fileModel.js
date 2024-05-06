const mongoose = require("mongoose");

const fileSchema = mongoose.Schema({
  fileName: {
    type: String,
    trim: true,
    maxLength: [20, "file name can not be more than 20 characters"],
  },

  file: {
    type: String,

    // required: [true, "Please, select a file"],
  },

  date: {
    type: Date,
    default: Date.now,
  },
});

const File = mongoose.model("File", fileSchema);
module.exports = File;
