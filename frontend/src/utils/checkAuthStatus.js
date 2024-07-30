// import axios from "axios";

// const baseURL = import.meta.env.VITE_BASE_URL;

// const api = axios.create({
//   baseURL,
//   withCredentials: true,
// });

// let isRefreshing = false;
// let failedQueue = [];

// const processQueue = (error, token = null) => {
//   failedQueue.forEach((prom) => {
//     if (error) {
//       prom.reject(error);
//     } else {
//       prom.resolve(token);
//     }
//   });

//   failedQueue = [];
// };

// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (error.response.status === 401 && !originalRequest._retry) {
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         })
//           .then(() => {
//             return api(originalRequest);
//           })
//           .catch((err) => Promise.reject(err));
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {
//         const { data } = await api.post("/users/refresh-token");
//         isRefreshing = false;
//         processQueue(null, data.accessToken);
//         return api(originalRequest);
//       } catch (refreshError) {
//         isRefreshing = false;
//         processQueue(refreshError, null);
//         // Redirect to login or handle refresh failure
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export const checkAuth = async () => {
//   try {
//     const response = await api.get("/users/loggedIn");
//     return response.data.isLoggedIn;
//   } catch (error) {
//     console.error("Error checking authentication:", error);
//     return false;
//   }
// };

// export const refreshToken = async () => {
//   try {
//     const response = await api.post("/users/refresh-token");
//     return response.data.accessToken;
//   } catch (error) {
//     console.error("Error refreshing token:", error);
//     return null;
//   }
// };
