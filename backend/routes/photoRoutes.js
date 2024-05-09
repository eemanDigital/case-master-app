const express = require("express");
const {
  createPhoto,
  getPhotos,
  getPhoto,
  deletePhoto,
} = require("../controllers/photoController");
const { usersPhotoUpload } = require("../utils/multerPhotoHandler");

const photoRouter = express.Router();

photoRouter.post("/", usersPhotoUpload, createPhoto);
photoRouter.get("/", usersPhotoUpload, getPhotos);
photoRouter.get(":id", usersPhotoUpload, getPhoto);
photoRouter.delete("/:id", usersPhotoUpload, deletePhoto);

module.exports = photoRouter;
