const Firm = require("../models/firmModel");

const extractSubdomain = async (req, res, next) => {
  try {
    const host = req.get("host");
    const protocol = req.protocol;
    const fullUrl = `${protocol}://${host}`;
    
    const subdomain = host?.split(".")[0];
    
    if (subdomain && subdomain !== "www" && subdomain !== "api" && subdomain !== "localhost") {
      const firm = await Firm.findBySubdomain(subdomain);
      if (firm) {
        req.firm = firm;
        req.firmUrl = fullUrl;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = extractSubdomain;
