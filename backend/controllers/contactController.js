const Contact = require("../models/contactModel");
const catchAsync = require("../utils/catchAsync");

// Create a new contact/help request
exports.createContactRequest = catchAsync(async (req, res) => {
  await Contact.create({
    firmId: req.firmId,
    name: req.body.name,
    message: req.body.message,
  });

  res.status(200).json({ message: "Message sent successfully" });
});
