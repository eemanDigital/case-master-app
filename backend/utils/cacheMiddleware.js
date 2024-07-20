const { createClient } = require("redis");

// Create and connect the Redis client
const redisClient = createClient();
redisClient.connect().catch(console.error);

// cacheMiddleware.js

// exports.cacheMiddleware = async (req, res, next) => {
//   const redisKey = "cases"; // The key used for caching

//   try {
//     const cachedResult = await redisClient.get(redisKey);
//     if (cachedResult) {
//       const cases = JSON.parse(cachedResult);
//       return res.status(200).json({
//         results: cases.length,
//         fromCache: true,
//         data: cases,
//       });
//     } else {
//       next(); // No cache found, proceed to getCases function
//     }
//   } catch (error) {
//     console.error("Cache middleware error:", error);
//     next(error); // Proceed with error handling
//   }
// };

// cacheMiddleware.js
exports.cacheMiddleware = (key) => {
  return async (req, res, next) => {
    try {
      const cachedResult = await redisClient.get(key);
      if (cachedResult) {
        // Parse the cached result
        const data = JSON.parse(cachedResult);

        // Directly return the parsed data without assuming its type
        return res.status(200).json({
          results: Array.isArray(data) ? data.length : 1, // If it's an array, return its length, otherwise assume it's a single object
          fromCache: true,
          data: data,
        });
      } else {
        next(); // No cache found, proceed to the next middleware
      }
    } catch (error) {
      console.error("Cache middleware error:", error);
      next(error); // Proceed with error handling
    }
  };
};
