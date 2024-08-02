import { useState } from "react";
import axios from "axios";
import { Modal, Button } from "antd";
import { useGoogleLogin } from "@react-oauth/google";

const baseURL = import.meta.env.VITE_BASE_URL;

const CalendarEvent = () => {
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [message, setMessage] = useState("");
  // const [isModalVisible, setIsModalVisible] = useState(false);
  const [token, setToken] = useState(null);

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      const { code } = codeResponse;
      //   try {
      //     const response = await axios.post(`${baseURL}/auth/google`, { code });
      //     setToken(response.data.access_token);
      //     setMessage("Successfully authenticated with Google");
      //   } catch (error) {
      //     setMessage(`Authentication error: ${error.message}`);
      //   }
    },
    flow: "auth-code",
    scope: "https://www.googleapis.com/auth/calendar.events",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setMessage("Please authenticate with Google first");
      return;
    }

    console.log(token);

    const event = {
      eventTitle,
      eventDescription,
      eventLocation,
      startTime,
      endTime,
    };

    //   try {
    //     const response = await axios.post(
    //       `${baseURL}/google/create-events`,
    //       event,
    //       {
    //         headers: {
    //           Authorization: `Bearer ${token}`,
    //         },
    //       }
    //     );
    //     setMessage(`Event created successfully: ${response.data.htmlLink}`);
    //   } catch (error) {
    //     setMessage(`Error: ${error.message}`);
    //   }
  };

  // const showModal = () => {
  //   setIsModalVisible(true);
  // };

  // const handleOk = () => {
  //   setIsModalVisible(false);
  // };

  // const handleCancel = () => {
  //   setIsModalVisible(false);
  // };

  return (
    <>
      <h2>Create Google Calendar Event</h2>
      <Button onClick={login}>Sign in with Google</Button>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700">Event Title:</label>
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-gray-700">Event Description:</label>
          <textarea
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-gray-700">Event Location:</label>
          <input
            type="text"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-gray-700">Start Time:</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-gray-700">End Time:</label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">
          Create Event
        </button>
        {message && <p className="text-center text-red-500">{message}</p>}
      </form>
    </>
  );
};

export default CalendarEvent;
