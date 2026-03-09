const express = require("express");
const templateController = require("../controllers/templateController");
const { protect, restrictTo } = require("../controllers/authController");

const router = express.Router();

router.use(protect);

router.get("/featured", templateController.getFeaturedTemplates);
router.get("/by-practice-area", templateController.getTemplatesByPracticeArea);

router
  .route("/documents")
  .get(templateController.getGeneratedDocuments)
  .post(
    restrictTo("admin", "super-admin", "lawyer"),
    templateController.generateDocument
  );

router
  .route("/documents/:documentId")
  .get(templateController.getGeneratedDocument)
  .patch(templateController.updateGeneratedDocument);

router.post(
  "/documents/:documentId/export",
  templateController.exportDocument
);

router.post("/:templateId/duplicate", templateController.duplicateTemplate);

router
  .route("/:templateId")
  .get(templateController.getTemplate)
  .patch(
    restrictTo("admin", "super-admin", "lawyer"),
    templateController.updateTemplate
  )
  .delete(
    restrictTo("admin", "super-admin", "lawyer"),
    templateController.deleteTemplate
  );

router.post(
  "/:templateId/generate",
  templateController.generateDocument
);

router
  .route("/")
  .get(templateController.getAllTemplates)
  .post(
    restrictTo("admin", "super-admin", "lawyer"),
    templateController.createTemplate
  );

module.exports = router;
