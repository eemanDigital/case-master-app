const express = require("express");
const { getClients, createClient } = require("../controllers/clientController");

const clientRouter = express.Router();

clientRouter.get("/", getClients);
clientRouter.post("/", createClient);

module.exports = clientRouter;
