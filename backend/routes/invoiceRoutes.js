const express = require("express");
const {
  //   getClients,
  createInvoice,
  //   getClient,
  //   updateClient,
  //   deleteClient,
} = require("../controllers/invoiceController");

const router = express.Router();

// Route to create a new client
router.post("/", createInvoice);

// Route to get all clients
// router.get("/", getClients);

// // Route to get a specific client by ID
// router.get("/:id", getClient);

// // Route to update a specific client by ID
// router.patch("/:id", updateClient);

// // Route to delete a specific client by ID
// router.delete("/:id", deleteClient);

module.exports = router;
