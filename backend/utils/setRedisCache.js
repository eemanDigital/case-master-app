// const redisClient = require("./redisClient");

// const setRedisCache = async (key, data, expire = 300) => {
//   try {
//     // Store the fetched data in Redis with a 10-minute default expiration

//     // if (process.env.NODE_ENV === "development") {
//     //   await redisClient.set(key, JSON.stringify(data));
//     // }
//     await redisClient.set(key, JSON.stringify(data), {
//       EX: expire,
//       NX: true, // Set only if the key does not already exist
//     });
//   } catch (error) {
//     console.error("Error setting cache:", error);
//   }
// };

// module.exports = setRedisCache;
