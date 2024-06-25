const express = require("express");
const todoController = require("../controllers/todoController");
const { protect } = require("../controllers/authController");
const router = express.Router();

router.use(protect);

router.route("/").get(todoController.getTodos).post(todoController.createTodo);

router
  .route("/:id")
  .get(todoController.getTodo)
  .patch(todoController.updateTodo)
  .delete(todoController.deleteTodo);

module.exports = router;
