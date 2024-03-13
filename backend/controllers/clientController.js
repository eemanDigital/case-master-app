const { useClient } = require("sanity");
const Client = require("../models/clientModel");

exports.createClient = async (req, res, next) => {
  const client = await Client.create(req.body);

  res.status(201).json({
    data: client,
  });
};

exports.getClients = async (req, res, next) => {
  const clients = await Client.find({});

  res.status(200).json({
    results: clients.length,
    data: clients,
  });
};
