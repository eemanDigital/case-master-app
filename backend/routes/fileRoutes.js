const express = require("express");
const {
  createFile,
  getFiles,
  downloadFile,
  getFile,
  updateFile,
  deleteFile,
} = require("../controllers/fileController");
const { uploadUserPhoto } = require("../utils/handleFile");

const fileRouter = express.Router();

fileRouter.post("/", uploadUserPhoto, createFile);
fileRouter.get("/", uploadUserPhoto, getFiles);
fileRouter.get("/:id", uploadUserPhoto, downloadFile);
fileRouter.get("/file/:id", uploadUserPhoto, getFile);
// fileRouter.patch("//:id", uploadUserPhoto, updateFile);
fileRouter.delete("/:id", uploadUserPhoto, deleteFile);

module.exports = fileRouter;
