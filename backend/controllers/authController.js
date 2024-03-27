const AppError = require("../utils/appError");
const { promisify } = require("util");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");

const createSendToken = require("../utils/handleSendToken");

///// function to implement user signup
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

///// function to handle login
exports.login = catchAsync(async (req, res, next) => {
  let { email, password } = req.body;
  // console.log(email, password);
  console.log(req.headers.authorization);
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

///PROTECT HANDLER FUNCTION
//1) check if user has token
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Kindly login before accessing this page", 401));
  }

  //2) verify the token whether valid
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError("User no longer exist for this token", 401));
  }

  //4 Check if user changed password after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    console.log(decoded.iat);
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  //5) give user access
  req.user = currentUser;
  next();
});
