import { useState } from "react";
import axios from "axios";

const baseURL = import.meta.env.VITE_BASE_URL;

const CalendarEventForm = () => {
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState(""); // State for event description
  const [eventLocation, setEventLocation] = useState(""); // State for event location
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const event = {
      summary: eventTitle,
      description: eventDescription, // Include description in the event object
      location: eventLocation, // Include location in the event object
      start: {
        dateTime: startTime,
        timeZone: "America/Los_Angeles",
      },
      end: {
        dateTime: endTime,
        timeZone: "America/Los_Angeles",
      },
    };

    const headers = {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${token}`,
    };

    axios
      .post(`${baseURL}/google/create-events`, event) // Correctly passing headers as part of the configuration object
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => console.log(error.message));
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Google Calendar Event</h2>
      <div>
        <label>Event Title:</label>
        <input
          type="text"
          value={eventTitle}
          onChange={(e) => setEventTitle(e.target.value)}
        />
      </div>
      <div>
        <label>Event Description:</label>
        <textarea
          value={eventDescription}
          onChange={(e) => setEventDescription(e.target.value)}
        />
      </div>
      <div>
        <label>Event Location:</label>
        <input
          type="text"
          value={eventLocation}
          onChange={(e) => setEventLocation(e.target.value)}
        />
      </div>
      <div>
        <label>Start Time:</label>
        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </div>
      <div>
        <label>End Time:</label>
        <input
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
      </div>
      <button type="submit">Create Event</button>
    </form>
  );
};

export default CalendarEventForm;
