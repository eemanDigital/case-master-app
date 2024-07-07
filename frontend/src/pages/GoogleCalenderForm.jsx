// import { useState } from "react";
// import axios from "axios";

// const baseURL = import.meta.env.VITE_BASE_URL;

// const CalendarEventForm = () => {
//   const [eventTitle, setEventTitle] = useState("");
//   const [eventDescription, setEventDescription] = useState(""); // State for event description
//   const [eventLocation, setEventLocation] = useState(""); // State for event location
//   const [startTime, setStartTime] = useState("");
//   const [endTime, setEndTime] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const event = {
//       eventTitle,
//       eventDescription, // Include description in the event object
//       eventLocation, // Include location in the event object
//       startTime,
//       endTime,
//     };

//     const headers = {
//       "Content-Type": "application/json",
//       // Authorization: `Bearer ${token}`,
//     };

//     axios
//       .post(`${baseURL}/google/create-events`, event, { headers }) // Correctly passing headers as part of the configuration object
//       .then((response) => {
//         console.log(response.data);
//       })
//       .catch((error) => console.log(error.message));
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <h2>Create Google Calendar Event</h2>
//       <div>
//         <label>Event Title:</label>
//         <input
//           type="text"
//           value={eventTitle}
//           onChange={(e) => setEventTitle(e.target.value)}
//         />
//       </div>
//       <div>
//         <label>Event Description:</label>
//         <textarea
//           value={eventDescription}
//           onChange={(e) => setEventDescription(e.target.value)}
//         />
//       </div>
//       <div>
//         <label>Event Location:</label>
//         <input
//           type="text"
//           value={eventLocation}
//           onChange={(e) => setEventLocation(e.target.value)}
//         />
//       </div>
//       <div>
//         <label>Start Time:</label>
//         <input
//           type="datetime-local"
//           value={startTime}
//           onChange={(e) => setStartTime(e.target.value)}
//         />
//       </div>
//       <div>
//         <label>End Time:</label>
//         <input
//           type="datetime-local"
//           value={endTime}
//           onChange={(e) => setEndTime(e.target.value)}
//         />
//       </div>
//       <button type="submit">Create Event</button>
//     </form>
//   );
// };

// export default CalendarEventForm;

import { useState } from "react";
import axios from "axios";

const baseURL = import.meta.env.VITE_BASE_URL;

const CalendarEventForm = () => {
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState(""); // State for event description
  const [eventLocation, setEventLocation] = useState(""); // State for event location
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const event = {
      eventTitle,
      eventDescription, // Include description in the event object
      eventLocation, // Include location in the event object
      startTime,
      endTime,
    };

    try {
      const token = localStorage.getItem("token"); // Assuming you store the token in local storage
      console.log(token);
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.post(
        `${baseURL}/google/create-events`,
        event,
        { headers }
      );

      setMessage(`Event created successfully: ${response.data.htmlLink}`); // Display the link to the created event
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
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
      {message && <p>{message}</p>}
    </form>
  );
};

export default CalendarEventForm;
