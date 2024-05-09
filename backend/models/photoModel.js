const mongoose = require("mongoose");

const photoSchema = mongoose.Schema({
  photo: {
    type: String,
    default:
      "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?t=st=1715239589~exp=1715243189~hmac=cf67c10b135c8e8642af2dc164824fffe4477476b96cdf235d00f60beaa72391&w=740",

    // required: [true, "Please, select a file"],
  },

  date: {
    type: Date,
    default: Date.now,
  },
});

const Photo = mongoose.model("Photo", photoSchema);
module.exports = Photo;
