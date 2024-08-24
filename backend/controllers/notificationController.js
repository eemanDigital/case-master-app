const Notice = require("../models/notificationModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// add notification
exports.createNotification = catchAsync(async (req, res, next) => {
  const notice = await Notice.create(req.body);
  res.status(201).json({
    data: notice,
  });
});

// get one notification
exports.getNotification = catchAsync(async (req, res, next) => {
  //if id/caseId provided does not exist
  const _id = req.params.id;
  const data = await Notice.findById({ _id });
  if (!data) {
    return next(new AppError("No Notification found with that Id", 404));
  }
  res.status(200).json({
    data,
  });
});

// delete notification
exports.deleteNotification = catchAsync(async (req, res, next) => {
  const _id = req.params.id;
  const data = await Notice.findByIdAndDelete({ _id });

  if (!data) {
    return next(new AppError("Notification with that Id does not exist", 404));
  }
  res.status(204).json({
    message: "Notice deleted",
  });
});
