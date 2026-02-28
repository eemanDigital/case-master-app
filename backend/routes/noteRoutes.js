const express = require("express");
const noteController = require("../controllers/noteController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.use(protect);

router.route("/")
  .post(noteController.createNote)
  .get(noteController.getNotes);

router.get("/stats", noteController.getNoteStats);
router.get("/trash", noteController.getTrashNotes);

router.route("/:id")
  .get(noteController.getNote)
  .patch(noteController.updateNote)
  .delete(noteController.deleteNote);

router.patch("/:id/restore", noteController.restoreNote);
router.patch("/:id/pin", noteController.togglePin);
router.patch("/:id/favorite", noteController.toggleFavorite);

module.exports = router;
