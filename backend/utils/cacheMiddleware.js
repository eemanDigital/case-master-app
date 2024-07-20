const redisClient = require("./redisClient");

async function cacheMiddleware(req, res, next) {
  const cacheKey = req.originalUrl || req.url; // Use URL as cache key
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        fromCache: true,
        data: JSON.parse(cachedData),
      });
    } else {
      next();
    }
  } catch (error) {
    console.error("Cache middleware error:", error);
    next();
  }
}

module.exports = cacheMiddleware;
