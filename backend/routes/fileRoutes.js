// const express = require("express");
// const {
//   createFile,
//   getFiles,
//   downloadFile,
//   getFile,
//   updateFile,
//   deleteFile,
// } = require("../controllers/fileController");
// const { protect } = require("../controllers/authController");

// const { fileUpload } = require("../utils/multerDocHandler");

// const router = express.Router();
// // protect route
// router.use(protect);

// router.post("/", fileUpload, createFile);
// router.get("/", fileUpload, getFiles);
// router.get("/download/:id", fileUpload, downloadFile);
// router.get("/file/:id", fileUpload, getFile);
// // router.patch("//:id", fileUpload, updateFile);
// router.delete("/:id", fileUpload, deleteFile);

// module.exports = router;
