const User = require("../models/userModel");

exports.signup = async (req, res, next) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        error: "Required fields must be fielded",
      });
    }

    let existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({
        error: "email already exist",
      });
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

    res.status(201).json({
      message: "User created",
      user,
    });
  } catch (err) {
    console.log(err);
    // let error = err.Path;
    let msg = err.message;
    let name = err.name;
    res.status(400).json({
      err,
      name,
      message: msg,
    });
  }

  // res.status(400).json({});
};

// exports.login = async (res, req, next) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({
//       message: "no email or password",
//     });
//   }

//   const { existingMail } = await User.findOne({ email });

//   if (existingMail) {
//     return res.status(400).json({ message: "email exist" });
//   }

//   return res.status(200).status({
//     message: "Sign up successful",
//     data: {},
//   });
// };
