const { Alert, ClientCompany } = require("../../models/cacCompliance");
const AppError = require("../../utils/appError");

exports.getAlerts = async (req, res, next) => {
  try {
    const alerts = await Alert.find({
      recipientId: req.user._id,
      lawFirmId: req.firmId,
    })
      .populate("companyId", "name rcNumber")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Alert.countDocuments({
      recipientId: req.user._id,
      lawFirmId: req.firmId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const alert = await Alert.findOne({
      _id: req.params.id,
      recipientId: req.user._id,
      lawFirmId: req.firmId,
    });

    if (!alert) {
      return next(new AppError("Alert not found", 404));
    }

    alert.isRead = true;
    await alert.save();

    res.status(200).json({
      success: true,
      data: alert,
      message: "Alert marked as read",
    });
  } catch (error) {
    next(error);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Alert.updateMany(
      {
        recipientId: req.user._id,
        lawFirmId: req.firmId,
        isRead: false,
      },
      { isRead: true },
    );

    res.status(200).json({
      success: true,
      data: null,
      message: "All alerts marked as read",
    });
  } catch (error) {
    next(error);
  }
};

exports.createAlert = async (alertData) => {
  try {
    const alert = new Alert(alertData);
    await alert.save();
    return alert;
  } catch (error) {
    console.error("Error creating alert:", error);
    return null;
  }
};

exports.getAlertsForCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    const company = await ClientCompany.findOne({
      _id: companyId,
      lawFirmId: req.firmId,
    });

    if (!company) {
      return next(new AppError("Company not found", 404));
    }

    const alerts = await Alert.find({
      companyId,
      lawFirmId: req.firmId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};
