const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const PREMIUM_FEATURES = {
  feeProtector: "Fee Protector",
  deadlineEngine: "Custom Deadline Engine",
  complianceTracker: "Compliance & Annual Return Tracker",
  watchdog: "CAC Status Watchdog",
  automationBuilder: "Custom Automation Builder",
};

const PREMIUM_PLANS = ["PRO", "ENTERPRISE"];

const checkPremiumAccess = catchAsync(async (req, res, next) => {
  if (!req.firm) {
    return next(new AppError("Firm information not found", 400));
  }

  const firm = req.firm;

  if (!firm.subscription) {
    return next(
      new AppError(
        "No active subscription found. Please subscribe to access premium features.",
        402
      )
    );
  }

  const plan = firm.subscription.plan?.toUpperCase() || "FREE";

  if (PREMIUM_PLANS.includes(plan)) {
    return next();
  }

  const feature = req.premiumFeature || "this premium feature";

  return next(
    new AppError(
      `${feature} is a premium feature. Please upgrade your plan to PRO or ENTERPRISE to access this feature.`,
      403
    )
  );
});

exports.premiumFeatureGuard = (featureName) => {
  return (req, res, next) => {
    req.premiumFeature = PREMIUM_FEATURES[featureName] || featureName;
    checkPremiumAccess(req, res, next);
  };
};

exports.premiumFeatureGuardMiddleware = checkPremiumAccess;

exports.FEATURE_LIST = PREMIUM_FEATURES;
exports.PREMIUM_PLANS = PREMIUM_PLANS;
