// import { useState } from "react";
// import { useAuthContext } from "./useAuthContext";
// import { useNavigate } from "react-router-dom";

// export const useSignUp = () => {
//   const [error, setError] = useState(null);
//   const [isLoading, setIsLoading] = useState(null);
//   const { dispatch } = useAuthContext();
//   const navigate = useNavigate();

//   const signup = async (...args) => {
//     setIsLoading(true);
//     setError(null);

//     const response = await fetch("http://localhost:3300/users/signup", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ ...args }),
//     });
//     const data = await response.json();

//     // console.log(json);
//     // console.log(response.data);

//     if (!response.ok) {
//       setIsLoading(false);

//       if (data.message.includes("User validation")) {
//         // console.log(typeof data.message);
//         setError(data.message.split(":")[2]);
//       } else {
//         setError(data.message);
//         // console.log(json.message);
//       }
//     }

//     if (response.ok) {
//       // save user to local storage
//       // localStorage.setItem('user', JSON.stringify(json));

//       // update the auth context
//       dispatch({ type: "LOGIN", payload: data });
//       // console.log({ payload: json });
//       setIsLoading(false);
//       navigate("/login");
//     }
//   };

//   return { signup, isLoading, error, setError };
// };
