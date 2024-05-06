const express = require("express");
const {
  createFile,
  getFiles,
  downloadFile,
} = require("../controllers/fileController");
const { uploadUserPhoto } = require("../utils/handleFile");

const fileRouter = express.Router();

fileRouter.post("/", uploadUserPhoto, createFile);
fileRouter.get("/", uploadUserPhoto, getFiles);
fileRouter.get("/:id", uploadUserPhoto, downloadFile);

module.exports = fileRouter;
