const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const { google } = require("googleapis");

const app = express();
app.use(express.json());

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post("/auth/google", async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    // Use payload information as needed
    // For example, include the user's email in the response
    const userEmail = payload["email"]; // Extracting the user's email from the payload

    // After verifying the token, use it to list calendar events
    const events = await listCalendarEvents(token);
    res.json({
      message: "Token verified successfully",
      user: userEmail, // Including the user's email in the response
      events: events,
    });
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
});

// Access Google API
async function listCalendarEvents(token) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime",
  });

  return res.data.items;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
