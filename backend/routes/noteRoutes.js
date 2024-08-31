const express = require("express");
const noteController = require("../controllers/noteController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router
  .route("/")
  .post(protect, noteController.createNote)
  .get(protect, noteController.getNotes);

router
  .route("/:id")
  .get(protect, noteController.getNote)
  .patch(protect, noteController.updateNote)
  .delete(protect, noteController.deleteNote);

module.exports = router;
