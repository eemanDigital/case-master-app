const express = require("express");
const {
  getClients,
  createClient,
  getClient,
  updateClient,
  deleteClient,
} = require("../controllers/clientController");

const clientRouter = express.Router();

// Route to get all clients
clientRouter.get("/", getClients);

// Route to create a new client
clientRouter.post("/", createClient);

// Route to get a specific client by ID
clientRouter.get("/:id", getClient);

// Route to update a specific client by ID
clientRouter.patch("/:id", updateClient);

// Route to delete a specific client by ID
clientRouter.delete("/:id", deleteClient);

module.exports = clientRouter;
