// import { useState } from "react";
// import axios from "axios";

// const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";

// const useFetch = () => {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchData = async (endpoint, method = "GET", payload = null) => {
//     try {
//       setLoading(true);
//       const url = `${baseURL}/${endpoint}`;
//       console.log(url);
//       const response = await axios({
//         method,
//         url,
//         data: payload,
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });
//       setData(response.data);
//     } catch (err) {
//       setError(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return { data, loading, error, fetchData };
// };

// export default useFetch;
