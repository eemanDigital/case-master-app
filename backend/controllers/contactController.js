const Contact = require("../models/contactModel");
const catchAsync = require("../utils/catchAsync");

// Create a new contact/help request
exports.createContactRequest = catchAsync(async (req, res) => {
  await Contact.create({
    firmId: req.firmId,
    name: req.body.name,
    email: req.body.email,
    category: req.body.category || "support",
    subject: req.body.subject,
    message: req.body.message,
  });

  res.status(200).json({ message: "Message sent successfully" });
});

// Get all contact requests (admin only)
exports.getAllContacts = catchAsync(async (req, res) => {
  const contacts = await Contact.find({ firmId: req.firmId })
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: contacts.length,
    data: contacts,
  });
});

// Get single contact request (admin only)
exports.getContact = catchAsync(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    firmId: req.firmId,
  });

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: "Contact request not found",
    });
  }

  // Mark as read
  contact.readByAdmin = true;
  await contact.save();

  res.status(200).json({
    success: true,
    data: contact,
  });
});

// Update contact status and reply (admin only)
exports.updateContact = catchAsync(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    firmId: req.firmId,
  });

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: "Contact request not found",
    });
  }

  const { status, priority, adminReply } = req.body;

  if (status) contact.status = status;
  if (priority) contact.priority = priority;
  if (adminReply !== undefined) contact.adminReply = adminReply;

  await contact.save();

  res.status(200).json({
    success: true,
    message: "Contact updated successfully",
    data: contact,
  });
});

// Delete contact request (admin only)
exports.deleteContact = catchAsync(async (req, res) => {
  const contact = await Contact.findOneAndDelete({
    _id: req.params.id,
    firmId: req.firmId,
  });

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: "Contact request not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Contact deleted successfully",
  });
});
