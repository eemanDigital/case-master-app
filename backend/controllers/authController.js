const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const bcrypt = require("bcryptjs");
const createSendToken = require("../utils/handleSendToken");
// const catchAsync = require("../utils/catchAsync");

exports.signup = async (req, res, next) => {
  const { email, password, passwordConfirm, firstName, lastName } = req.body;
  // console.log(req.originalUrl);
  // console.log(req.baseUrl);

  if (!email || !password || !firstName || !lastName) {
    next(new AppError("Required fields must be fielded", 400));
  }

  if (password !== passwordConfirm) {
    next(new AppError("Password and passwordConfirm must be the same", 400));
  }

  let existingEmail = await User.findOne({ email });

  if (existingEmail) {
    next(new AppError("email already exist", 400));
  }

  const user = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    middleName: req.body.middleName,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    photo: req.body.photo,
    role: req.body.role,
    position: req.body.position,
    yearOfCall: req.body.yearOfCall,
    otherPosition: req.body.otherPosition,
    practiceArea: req.body.practiceArea,
  });

  createSendToken(user, 201, res);
};

exports.login = catchAsync(async (req, res, next) => {
  let { email, password } = req.body;
  // console.log(email, password);

  // 1) Check if email and password exist
  if (!email || !password) {
    next(new AppError("Provide email and password", 400));
  }
  //2) compare email and password with data in db
  let user = await User.findOne({ email }).select("+password");

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  createSendToken(user, 200, res);
});
