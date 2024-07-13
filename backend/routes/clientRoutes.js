const express = require("express");
const {
  getClients,
  getClient,
  updateClient,
  deleteClient,
} = require("../controllers/clientController");
const {
  signup,
  forgotPassword,
  resetPassword,
  logout,
  isLoggedIn,
  updatePassword,
  login,
} = require("../controllers/clientAuthController");
const { protect, restrictTo } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);
router.patch("/resetpassword/:token", resetPassword);

// router.use(protect);
router.get("/logout", logout);
router.get("/loggedIn", isLoggedIn);
router.patch("/changepassword", updatePassword);

// Route to get all clients
router.get("/", getClients);

// Route to get a specific client by ID
router.get("/:id", getClient);

// Route to update a specific client by ID
router.patch("/:id", updateClient);

// Route to delete a specific client by ID
router.delete("/:id", deleteClient);

module.exports = router;
