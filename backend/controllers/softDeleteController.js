// This controller handles soft deletion and restoration of items in the database.
// It exports two functions: softDeleteItem and restoreDelete.
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.softDeleteItem = ({ model, modelName }) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;

    const item = await model.findById(id);

    if (!item) {
      return next(new AppError(`${modelName} not found`, 404));
    }

    if (item.isDeleted) {
      return next(new AppError(`${modelName} already deleted`, 400));
    }

    item.isDeleted = true;
    item.deletedAt = new Date();
    item.deletedBy = userId;

    try {
      await item.save();
      return res
        .status(200)
        .json({ message: `${modelName} successfully deleted` });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: `Failed to delete ${modelName}` });
    }
  });

exports.restoreDelete = ({ model, modelName }) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const item = await model.findById(id);

    if (!item) {
      return next(new AppError(`${modelName} not found`, 404));
    }
    if (!item.isDeleted) {
      return next(
        new AppError(
          `${modelName} already restored, please refresh your page`,
          400
        )
      );
    }
    item.isDeleted = false;
    item.deletedAt = null;
    item.deletedBy = null;
    try {
      await item.save();
      return res
        .status(200)
        .json({ message: `${modelName} successfully restored` });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: `Failed to restore ${modelName}` });
    }
  });
