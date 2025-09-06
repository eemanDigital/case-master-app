const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// controllers/softDeleteController.js
exports.softDeleteItem = ({ model, modelName }) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user._id;

    const item = await model.findById(id);

    if (!item) {
      return next(new AppError(`${modelName} not found with ID: ${id}`, 404));
    }

    if (item.isDeleted) {
      return next(new AppError(`${modelName} already deleted`, 400));
    }

    item.isDeleted = true;
    item.deletedAt = new Date();
    item.deletedBy = userId;

    try {
      await item.save();

      res.status(200).json({
        message: `${modelName} soft deleted successfully`,
        deletedId: id,
      });
    } catch (error) {
      console.error(error);
      return next(new AppError(`Failed to delete ${modelName}`, 500));
    }
  });

// restore soft deleted item
exports.restoreItem = ({ model, modelName }) =>
  catchAsync(async (req, res, next) => {
    const { itemId } = req.params;

    const item = await model.findById(itemId);

    if (!item) {
      return next(
        new AppError(`${modelName} not found with ID: ${itemId}`, 404)
      );
    }

    if (!item.isDeleted) {
      return next(new AppError(`${modelName} is not deleted`, 400));
    }

    item.isDeleted = false;
    item.deletedAt = null;
    item.deletedBy = null;

    await item.save();

    res.status(200).json({
      message: `${modelName} restored successfully`,
      data: item,
    });
  });

// get all deleted items
exports.getDeletedItems = ({ model, modelName, sortParams }) =>
  catchAsync(async (req, res, next) => {
    // Fetch cases from the database
    let items = await model.find({ isDeleted: true }).sort(sortParams);

    // Handle the case where no items are found
    if (items.length === 0) {
      return next(new AppError(`No ${modelName} found`, 404));
    }

    // set redis key for caching
    // setRedisCache("items", items);

    // Send the response with the fetched items
    res.status(200).json({
      results: items.length,
      fromCache: false,
      data: items,
    });
  });
