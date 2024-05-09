const express = require("express");
const {
  createFile,
  getFiles,
  downloadFile,
  getFile,
  updateFile,
  deleteFile,
} = require("../controllers/fileController");
const { fileUpload } = require("../utils/multerDocHandler");

const fileRouter = express.Router();

fileRouter.post("/", fileUpload, createFile);
fileRouter.get("/", fileUpload, getFiles);
fileRouter.get("/:id", fileUpload, downloadFile);
fileRouter.get("/file/:id", fileUpload, getFile);
// fileRouter.patch("//:id", fileUpload, updateFile);
fileRouter.delete("/:id", fileUpload, deleteFile);

module.exports = fileRouter;
