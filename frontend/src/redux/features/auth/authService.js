import axios from "axios";

const baseURL = import.meta.env.VITE_BASE_URL;
export const API_URL = `${baseURL}/users/`;

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

  return response.data.message;
};
// get login status
const getLoginStatus = async () => {
  const response = await axios.get(API_URL + "loginStatus");
  return response.data;
};

/// get user
const getUser = async () => {
  const response = await axios.get(API_URL + "getUser");
  // console.log("rRESd", response.data);
  return response.data;
};

/// get user
const getUsers = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

///send verification email
const sendVerificationMail = async (email) => {
  const response = await axios.post(API_URL + `sendVerificationEmail/${email}`);
  return response.data.message;
};

///verify user
const verifyUser = async (verificationToken) => {
  const response = await axios.patch(
    API_URL + `verifyUser/${verificationToken}`
  );
  return response.data.message;
};
///forgot password
const forgotUserPassword = async (userData) => {
  const response = await axios.post(API_URL + "forgotpassword", userData);
  return response.data.message;
};
///rest password
const resetPassword = async (resetToken, userData) => {
  const response = await axios.patch(
    `${API_URL}resetpassword/${resetToken}`,
    userData
  );
  return response.data.message;
};

// password change
const changePassword = async (userData) => {
  const response = await axios.patch(API_URL + "changepassword", userData);
  return response.data.message;
};

// delete user
const deleteUser = async (id) => {
  const response = await axios.delete(API_URL + id);
  return response.data.message;
};

// send Login code 2FA
const sendLoginCode = async (email) => {
  const response = await axios.post(API_URL + `sendLoginCode/${email}`);
  return response.data.message;
};

// login with code after email sent (2FA)
const loginWithCode = async (code, email) => {
  const response = await axios.post(API_URL + `loginWithCode/${email}`, code);
  return response.data;
};
// login with google
const loginWithGoogle = async (userToken) => {
  const response = await axios.post(API_URL + "google/callback", userToken);
  return response.data;
};

const authService = {
  register,
  login,
  logout,
  getLoginStatus,
  getUser,
  getUsers,
  sendVerificationMail,
  verifyUser,
  forgotUserPassword,
  resetPassword,
  changePassword,
  deleteUser,
  sendLoginCode,
  loginWithCode,
  loginWithGoogle,
};

export default authService;
