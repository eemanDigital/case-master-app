const User = require("../models/userModel");

exports.createUser = async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    data: user,
  });
};

exports.getUsers = async (req, res, next) => {
  const users = await User.find({});

  res.status(200).json({
    data: users,
  });
};
