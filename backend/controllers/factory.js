// exports.createDocument = (parentId, model, fileDirectory) => {
//   return catchAsync(async (req, res, next) => {
//     const { caseId } = req.params;
//     const { fileName } = req.body;
//     const { file } = req;

//     if (!file) {
//       return next(new AppError("Please provide a document file", 400));
//     }

//     if (!fileName || fileName.trim() === "") {
//       return next(
//         new AppError("A file name is required for each document", 400)
//       );
//     }

//     const filePath = path.join("public/caseDoc", file.filename);

//     const document = {
//       fileName,
//       file: filePath,
//     };

//     const updatedDoc = await model.findByIdAndUpdate(
//       caseId,
//       { $push: { documents: document } }, // Push new document to the documents array
//       { new: true, runValidators: true }
//     );

//     if (!updatedDoc) {
//       return next(new AppError(`No document found with ID: ${parentId}`, 404));
//     }

//     res.status(200).json({
//       message: "Document successfully uploaded",
//       updatedDoc,
//     });
//   });
// };
