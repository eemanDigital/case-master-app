// const { OAuth2Client } = require("google-auth-library");
const { google } = require("googleapis");
const catchAsync = require("../utils/catchAsync");
const { auth } = require("google-auth-library");

// console.log(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_SECRET_ID);
const oauth2Client = new google.auth.OAuth2(
  "475787186709-i5iph876jt4hlchjqhig0faoukvo7pii.apps.googleusercontent.com",
  "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",
  "http://localhost:5173"
);
// const oauth2Client = new google.auth.OAuth2(
//   process.env.GOOGLE_CLIENT_ID,
//   process.env.GOOGLE_SECRET_ID,
//   process.env.REDIRECT
// );

// console.log(oauth2Client);

const refreshToken =
  "1//03pywlri-f3N6CgYIARAAGAMSNgF-L9IrMqH46sK_v5G5Ufhf35nfKdn6OkeQPQXmf8zFgit3ff6ot_oaplAd8GkkUr0gGCYMTA"; //should be stored in the db

exports.createToken = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  // console.log(code);
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
      colorId: "1",
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
