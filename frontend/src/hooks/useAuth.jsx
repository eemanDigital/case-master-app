import { useState } from "react";
import axios from "axios";
// import AuthContextProvider from "../context/authContext";
// import { AuthContext } from "../context/authContext";
import { useAuthContext } from "./useAuthContext";

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";

export const useAuth = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { dispatch } = useAuthContext();

  const authenticate = async (endpoint, method = "GET", payload = null) => {
    try {
      setLoading(true);
      const url = `${baseURL}/${endpoint}`;
      const token = null;
      const response = await axios({
        method,
        url,
        data: payload,
        headers: {
          "Content-Type": "application/json",
        },
        token,
      });

      //   if(token){
      // headers['Authorization'] = `Bearer ${token}`;

      //   }

      // console.log("TOKEN", token);
      console.log("TOKEN", payload);

      setData(response.data);

      // console.log("DATA", response);
      localStorage.setItem("user", JSON.stringify(response.data));
      dispatch({ type: "LOGIN", payload: response.data });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, authenticate };
};

// export const useLogin = () => {
//   const [error, setError] = useState(null);
//   const [isLoading, setIsLoading] = useState(null);
//   const { dispatch } = useAuthContext();
//   const navigate = useNavigate();

//   const login = async (...args) => {
//     setIsLoading(true);
//     setError(null);

//     const response = await fetch("http://localhost:3000/api/v1/users/login", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ ...args }),
//     });
//     const data = await response.json();

//     // console.log(json);
//     // console.log(response.data);

//     if (!response.ok) {
//       setIsLoading(false);
//       setError(data.message);
//       // console.log(json);
//     }
//     if (response.ok) {
//       // save user to local storage
//       localStorage.setItem("user", JSON.stringify(data));
//       // console.log(data);

//       // update the auth context
//       dispatch({ type: "LOGIN", payload: data });
//       // console.log({ payload: data });
//       setIsLoading(false);
//       navigate("/blog");
//     }
//   };

//   return { login, isLoading, error, setError };
// };
