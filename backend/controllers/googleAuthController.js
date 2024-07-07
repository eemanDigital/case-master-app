const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const { google } = require("googleapis");
const { oauth2Client, setCredentials } = require("../utils/oauthClient");

exports.createToken = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  const { tokens } = await oauth2Client.getToken(code);

  const user = await User.findById(req.user.id);
  user.googleRefreshToken = tokens.refresh_token;
  await user.save();

  res.send(tokens);
});

exports.createEvents = catchAsync(async (req, res, next) => {
  const { eventTitle, eventDescription, eventLocation, startTime, endTime } =
    req.body;

  const user = await User.findById(req.user.id).select("+googleRefreshToken");
  const auth = await setCredentials(user);
  const calendar = google.calendar({ version: "v3", auth });

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: eventTitle,
      description: eventDescription,
      location: eventLocation,
      colorId: "6",
      start: { dateTime: new Date(startTime) },
      end: { dateTime: new Date(endTime) },
    },
  });

  res.send(response.data);
});
