const express = require("express");
const router = express.Router();

const {
  companyController,
  complianceController,
  taskController,
  letterController,
  alertController,
} = require("../controllers/cacCompliance");

const {
  scopeToFirm,
  canAccessCACModule,
} = require("../middleware/cacComplianceAuth");

const authenticate = require("../controllers/authController").protect;

router.use(authenticate);
router.use(canAccessCACModule);
router.use(scopeToFirm);

router.get("/dashboard", complianceController.getDashboard);
router.get("/at-risk", complianceController.getAtRisk);
router.get("/deadlines", complianceController.getDeadlines);
router.put("/checks/:id/resolve", complianceController.resolveCheck);

router.get("/companies", companyController.getCompanies);
router.post("/companies", companyController.createCompany);
router.get("/companies/stats", companyController.getDashboardStats);
router.get("/companies/:id", companyController.getCompany);
router.put("/companies/:id", companyController.updateCompany);
router.delete("/companies/:id", companyController.deleteCompany);
router.post("/companies/:id/audit", companyController.runAudit);

router.get("/tasks", taskController.getTasks);
router.post("/tasks", taskController.createTask);
router.get("/tasks/overdue", taskController.getOverdueTasks);
router.get("/tasks/company/:companyId", taskController.getTasksByCompany);
router.get("/tasks/:id", taskController.getTask);
router.put("/tasks/:id", taskController.updateTask);
router.delete("/tasks/:id", taskController.deleteTask);

router.get("/letters", letterController.getLetters);
router.post("/letters/generate", letterController.generateLetter);
router.get("/letters/company/:companyId", letterController.getLettersByCompany);
router.get("/letters/:id", letterController.getLetter);
router.put("/letters/:id", letterController.updateLetter);
router.post("/letters/:id/send", letterController.markSent);
router.delete("/letters/:id", letterController.deleteLetter);

router.get("/alerts", alertController.getAlerts);
router.get("/alerts/unread-count", alertController.getUnreadCount);
router.get("/alerts/company/:companyId", alertController.getAlertsForCompany);
router.put("/alerts/:id/read", alertController.markRead);
router.post("/alerts/read-all", alertController.markAllRead);

module.exports = router;
