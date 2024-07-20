const redis = require("redis");

let redisClient;

(async () => {
  redisClient = redis.createClient();

  redisClient.on("error", (error) => console.error("ERROR: ", error));

  await redisClient.connect();
})();

module.exports = redisClient;
