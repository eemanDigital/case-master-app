const dotenv = require("dotenv");
const catchAsync = require("../utils/catchAsync");
const { google } = require("googleapis");

dotenv.config({ path: "./config.env" });

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.SECRET_ID,
  process.env.REDIRECT_URI
);
// console.log(oauth2Client);

// const refreshToken = process.env.GOGGLE_REFRESH_TOKEN; //should be stored in the db. just testing
exports.createToken = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  console.log("CODE", code);
  // get tokens
  const { tokens } = await oauth2Client.getToken(code); //destructure tokens from response
  // console.log(token);
  res.send(tokens);
});

exports.createEvents = catchAsync(async (req, res, next) => {
  const {
    eventTitle,
    eventDescription, // Include description in the event
    eventLocation,
    startTime,
    endTime,
  } = req.body;

  oauth2Client.setCredentials({ refresh_token: refreshToken });
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

  res.send(response);
});
