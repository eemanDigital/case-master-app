import axios from "axios";

const baseURL = import.meta.env.VITE_BASE_URL;
const API_URL = `${baseURL}/users/`;

// register/add user
const register = async (userData) => {
  const response = await axios.post(API_URL + "register", userData);
  return response.data;
};

// login user
const login = async (userData) => {
  const response = await axios.post(API_URL + "login", userData);
  return response.data;
};
// logout user
const logout = async () => {
  const response = await axios.get(API_URL + "logout");
  console.log("LO", response);

  return response.data.message;
};
// get login status
const getLoginStatus = async () => {
  const response = await axios.get(API_URL + "loginStatus");
  console.log("rRESd", response.data);

  return response.data;
};

/// Update this function name to match the one used in your slice
const getUser = async () => {
  const response = await axios.get(API_URL + "getUser");
  // console.log("rRESd", response.data);
  return response.data;
};

const authService = {
  register,
  login,
  logout,
  getLoginStatus,
  getUser, // Ensure the name matches
};

export default authService;
