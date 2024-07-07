const dotenv = require("dotenv");
const { google } = require("googleapis");

dotenv.config({ path: "./config.env" });

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.SECRET_ID,
  process.env.REDIRECT_URI
);

console.log(oauth2Client);

const setCredentials = async (user) => {
  oauth2Client.setCredentials({
    refresh_token: user.googleRefreshToken,
  });

  // Refresh token if necessary
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.refresh_token) {
      user.googleRefreshToken = tokens.refresh_token;
      await user.save();
    }
  });

  return oauth2Client;
};

module.exports = { oauth2Client, setCredentials };
