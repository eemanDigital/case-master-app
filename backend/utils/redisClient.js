// const redis = require("redis");

// let redisClient;

// (async () => {
//   redisClient = redis.createClient();

//   redisClient.on("error", (error) => console.error("ERROR: ", error));

//   await redisClient.connect();
// })();

// module.exports = redisClient;

const { createClient } = require("redis");

// Create and configure the Redis client
const redisClient = createClient();

// Handle connection errors
redisClient.on("error", (error) => console.error("ERROR:", error));

// Connect to Redis
(async () => {
  await redisClient.connect();
})();

// Export the Redis client for use in other modules
module.exports = redisClient;
