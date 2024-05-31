const express = require("express");
const {
  getCases,
  createCase,
  getCase,
  updateCase,
  deleteCase,
  upload,
} = require("../controllers/caseController");
const { protect, restrictTo } = require("../controllers/authController");

const router = express.Router();
const app = express();

router.use(protect);

router.route("/").get(getCases).post(createCase);
// .post(createCase);
router
  .route("/:caseId")
  .get(getCase)
  .patch(updateCase)
  .delete(restrictTo("admin"), deleteCase);

module.exports = router;
