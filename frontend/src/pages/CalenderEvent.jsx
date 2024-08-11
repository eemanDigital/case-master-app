// import { useState } from "react";
// import axios from "axios";
// import { Button, Modal } from "antd";
// import { useGoogleLogin } from "@react-oauth/google";
// import { toast } from "react-toastify";
// import { useDataFetch } from "../hooks/useDataFetch";

// const baseURL = import.meta.env.VITE_BASE_URL;

// const Events = () => {
//   const [eventTitle, setEventTitle] = useState("");
//   const [eventDescription, setEventDescription] = useState("");
//   const [eventLocation, setEventLocation] = useState("");
//   const [startTime, setStartTime] = useState("");
//   const [endTime, setEndTime] = useState("");
//   const [message, setMessage] = useState("");

//   const {datafetcher, loading, error} = useDataFetch()

//     const event = {
//       eventTitle,
//       eventDescription,
//       eventLocation,
//       startTime,
//       endTime,
//     };

//     try {
//      const response = await da(`${baseURL}/google/create-events` );
//       toast.success("Event created successfully");
//       setIsModalVisible(false); // Close the modal on successful event creation
//     } catch (error) {
//       toast.error(error.message);
//     }
//   };

//   return (
//     <>

//       <Modal
//         title="Create Google Calendar Event"
//         visible={isModalVisible}
//         onCancel={() => setIsModalVisible(false)}
//         footer={null}>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-gray-700">Event Title:</label>
//             <input
//               type="text"
//               value={eventTitle}
//               onChange={(e) => setEventTitle(e.target.value)}
//               className="w-full px-3 py-2 border rounded-md"
//             />
//           </div>
//           <div>
//             <label className="block text-gray-700">Event Description:</label>
//             <textarea
//               value={eventDescription}
//               onChange={(e) => setEventDescription(e.target.value)}
//               className="w-full px-3 py-2 border rounded-md"
//             />
//           </div>
//           <div>
//             <label className="block text-gray-700">Event Location:</label>
//             <input
//               type="text"
//               value={eventLocation}
//               onChange={(e) => setEventLocation(e.target.value)}
//               className="w-full px-3 py-2 border rounded-md"
//             />
//           </div>
//           <div>
//             <label className="block text-gray-700">Start Time:</label>
//             <input
//               type="datetime-local"
//               value={startTime}
//               onChange={(e) => setStartTime(e.target.value)}
//               className="w-full px-3 py-2 border rounded-md"
//             />
//           </div>
//           <div>
//             <label className="block text-gray-700">End Time:</label>
//             <input
//               type="datetime-local"
//               value={endTime}
//               onChange={(e) => setEndTime(e.target.value)}
//               className="w-full px-3 py-2 border rounded-md"
//             />
//           </div>
//           <button
//             type="submit"
//             className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">
//             Create Event
//           </button>
//           {message && <p className="text-center text-red-500">{message}</p>}
//         </form>
//       </Modal>
//     </>
//   );
// };

// export default Events;
