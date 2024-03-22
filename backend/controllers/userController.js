const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");

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

exports.getUser = catchAsync(async (req, res, next) => {
  const _id = req.params.userId;
  const data = await User.findById({ _id });
  // console.log(id);
  if (!data) {
    return next(new AppError("no user found with that Id", 404));
  }
  res.status(200).json({
    data,
  });
});
