// import { notification } from "antd";
// import axios from "axios";

// const baseURL = import.meta.env.VITE_BASE_URL;

// const getToken = () => {
//   return document.cookie
//     .split("; ")
//     .find((row) => row.startsWith("jwt="))
//     ?.split("=")[1];
// };

// export const checkAuthStatus = async () => {
//   try {
//     const token = getToken();
//     if (!token) {
//       throw new Error("No token found");
//     }

//     const response = await axios.get(`${baseURL}/users/loggedIn`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//       withCredentials: true,
//     });

//     console.log(response, "AUTH STATUS");

//     return response.data.loggedIn; // Assuming your endpoint returns a `loggedIn` field
//   } catch (err) {
//     const errorMessage =
//       err.response?.data?.message ||
//       err.message ||
//       "There was an error checking log in status";
//     notification.error({
//       message: "Check Failed",
//       description: errorMessage,
//     });

//     console.error("Error checking auth status", err);
//     return false;
//   }
// };
