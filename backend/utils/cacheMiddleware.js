// // const redisClient = require("./redisClient");

// /**
//  * Cache middleware that checks for cached data based on a generated key.
//  * @param {Function} keyGenerator - Function to generate cache keys based on the request.
//  * @returns {Function} Express middleware function.
//  */
// const cacheMiddleware = (keyGenerator) => {
//   return async (req, res, next) => {
//     // Generate the cache key using the provided key generator function
//     const cacheKey = keyGenerator(req);
//     try {
//       // Try to get cached data from Redis
//       const cachedResult = await redisClient.get(cacheKey);
//       if (cachedResult) {
//         // Parse and return the cached data
//         const data = JSON.parse(cachedResult);
//         return res.status(200).json({
//           results: Array.isArray(data) ? data.length : 1, // Determine the number of results
//           fromCache: true,
//           data: data,
//         });
//       } else {
//         // No cached data found, proceed to the next middleware or route handler
//         next();
//       }
//     } catch (error) {
//       // Handle any errors that occur during caching
//       console.error("Cache middleware error:", error);
//       next(error); // Proceed with error handling
//     }
//   };
// };

// module.exports = cacheMiddleware;
