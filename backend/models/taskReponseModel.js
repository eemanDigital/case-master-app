// const mongoose = require("mongoose");
// // const User = require("./userModel");

// const taskResponseSchema = new mongoose.Schema(
//   {
//     response: {
//       completed: Boolean,
//       comment: String,
//       timestamp: Date.now,
//     },
//   },
//   {
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true },
//   }
// );

// // virtual populate for file attachment
// taskSchema.virtual("documents", {  //yet to be set at  file
//   ref: "File",
//   foreignField: "taskResponse",
//   localField: "_id",
// });
// // virtual populate notification or reminder
// // taskSchema.virtual("notice", {
// //   ref: "Notice",
// //   foreignField: "relatedTask",
// //   localField: "_id",
// // });

// const TaskResponse = mongoose.model("TaskResponse", taskResponseSchema);

// module.exports = TaskResponse;
