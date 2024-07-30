import { createContext, useReducer, useEffect } from "react";
// import { checkAuth, refreshToken } from "../utils/checkAuthStatus";
import axios from "axios";

export const AuthContext = createContext();

const baseURL = import.meta.env.VITE_BASE_URL;
export const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      return { user: action.payload };
    case "LOGOUT":
      return { user: null };
    default:
      return state;
  }
};

const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
  });

  useEffect(() => {
    const initAuth = async () => {
      // const isLoggedIn = await checkAuth();
      const isLoggedIn = false;
      if (isLoggedIn) {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
          dispatch({ type: "LOGIN", payload: user });
        }
      } else {
        // If not logged in, attempt to refresh the token
        // const newToken = await refreshToken();
        const newToken = "";
        if (newToken) {
          const user = JSON.parse(localStorage.getItem("user"));
          if (user) {
            dispatch({ type: "LOGIN", payload: user });
          }
        } else {
          // If refresh fails, log out the user
          dispatch({ type: "LOGOUT" });
          localStorage.removeItem("user");
        }
      }
    };

    initAuth();
  }, []);

  const logout = async () => {
    try {
      await axios.post(
        `${baseURL}/users/logout`,
        {},
        { withCredentials: true }
      );
      dispatch({ type: "LOGOUT" });
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, dispatch, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
