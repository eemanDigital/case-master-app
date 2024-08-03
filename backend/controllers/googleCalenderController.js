const dotenv = require("dotenv");
const catchAsync = require("../utils/catchAsync");
const { google } = require("googleapis");
const Token = require("../models/tokenModel");

dotenv.config({ path: "./config.env" });

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET_ID,
  process.env.REDIRECT_URI
);

exports.createToken = catchAsync(async (req, res, next) => {
  const { code } = req.body;

  const { tokens } = await oauth2Client.getToken(code);

  // Save the refresh token in the database
  await Token.findOneAndUpdate(
    { userId: req.user._id },
    {
      googleRefreshToken: tokens.refresh_token,
    },
    { new: true, upsert: true }
  );

  // Return the access token to the client
  res.send({ access_token: tokens.access_token });
});

exports.createEvents = catchAsync(async (req, res, next) => {
  const { eventTitle, eventDescription, eventLocation, startTime, endTime } =
    req.body;

  // Retrieve the refresh token from the database
  const tokenDoc = await Token.findOne({ userId: req.user._id });
  if (!tokenDoc) {
    return res.status(404).send({ message: "Refresh token not found" });
  }

  const { googleRefreshToken } = tokenDoc;
  oauth2Client.setCredentials({ refresh_token: googleRefreshToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: eventTitle,
      description: eventDescription,
      location: eventLocation,
      colorId: "6",
      start: {
        dateTime: new Date(startTime),
      },
      end: {
        dateTime: new Date(endTime),
      },
    },
  });

  res.send(response.data);
});
