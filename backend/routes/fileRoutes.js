const express = require("express");
const { createFile } = require("../controllers/fileController");
const { uploadUserPhoto } = require("../utils/handleFile");

const fileRouter = express.Router();

fileRouter.post("/", uploadUserPhoto, createFile);

module.exports = fileRouter;
