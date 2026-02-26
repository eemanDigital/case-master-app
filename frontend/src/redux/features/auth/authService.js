import axios from "axios";

const baseURL = import.meta.env.VITE_BASE_URL;
export const API_URL = `${baseURL}/users/`;

// ============================================
// AUTH
// ============================================

const register = async (userData) => {
  const response = await axios.post(API_URL + "register", userData);
  return response.data;
};

const login = async (userData) => {
  const response = await axios.post(API_URL + "login", userData);
  return response.data;
};

const logout = async () => {
  const response = await axios.get(API_URL + "logout");
  return response.data.message;
};

const getLoginStatus = async () => {
  const response = await axios.get(API_URL + "loginStatus");
  return response.data;
};

const getUser = async () => {
  const response = await axios.get(API_URL + "getUser");
  return response.data;
};

const getUsers = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

// ============================================
// STATISTICS  →  /users/statistics/*
// ============================================

/** GET /users/statistics/general */
const getUserStatistics = async () => {
  const response = await axios.get(API_URL + "statistics/general");
  return response.data;
};

/** GET /users/statistics/staff */
const getStaffStatistics = async () => {
  const response = await axios.get(API_URL + "statistics/staff");
  return response.data;
};

/** GET /users/statistics/clients */
const getClientStatistics = async () => {
  const response = await axios.get(API_URL + "statistics/clients");
  return response.data;
};

/** GET /users/statistics/status */
const getStatusStatistics = async () => {
  const response = await axios.get(API_URL + "statistics/status");
  return response.data;
};

// ============================================
// USER MANAGEMENT
// ============================================

const sendVerificationMail = async (email) => {
  const response = await axios.post(API_URL + `sendVerificationEmail/${email}`);
  return response.data.message;
};

const verifyUser = async (verificationToken) => {
  const response = await axios.patch(
    API_URL + `verifyUser/${verificationToken}`,
  );
  return response.data.message;
};

const forgotUserPassword = async (userData) => {
  const response = await axios.post(API_URL + "forgotpassword", userData);
  return response.data.message;
};

const resetPassword = async (resetToken, userData) => {
  const response = await axios.patch(
    `${API_URL}resetpassword/${resetToken}`,
    userData,
  );
  return response.data.message;
};

const changePassword = async (userData) => {
  const response = await axios.patch(API_URL + "changepassword", userData);
  return response.data.message;
};

/** Hard delete — super-admin only  →  DELETE /users/delete/:id */
const deleteUser = async (id) => {
  const response = await axios.delete(API_URL + `delete/${id}`);
  return response.data.message;
};

/** Soft delete  →  PATCH /users/soft-delete/:id */
const softDeleteUser = async (id) => {
  const response = await axios.patch(API_URL + `soft-delete/${id}`);
  return response.data;
};

/** Restore soft-deleted user  →  PATCH /users/restore/:id */
const restoreUser = async (id) => {
  const response = await axios.patch(API_URL + `restore/${id}`);
  return response.data;
};

/** Upgrade / change user role  →  PATCH /users/upgradeUser/:id */
const upgradeUser = async (id, userData) => {
  const response = await axios.patch(API_URL + `upgradeUser/${id}`, userData);
  return response.data;
};

// ============================================
// 2FA & SOCIAL AUTH
// ============================================

const sendLoginCode = async (email) => {
  const response = await axios.post(API_URL + `sendLoginCode/${email}`);
  return response.data.message;
};

const loginWithCode = async (code, email) => {
  const response = await axios.post(API_URL + `loginWithCode/${email}`, { loginCode: code });
  return response.data;
};

const loginWithGoogle = async (userToken) => {
  const response = await axios.post(API_URL + "google/callback", userToken);
  return response.data;
};

// ============================================
// EXPORT
// ============================================

const authService = {
  register,
  login,
  logout,
  getLoginStatus,
  getUser,
  getUsers,
  getUserStatistics,
  getStaffStatistics,
  getClientStatistics,
  getStatusStatistics,
  sendVerificationMail,
  verifyUser,
  forgotUserPassword,
  resetPassword,
  changePassword,
  deleteUser,
  softDeleteUser,
  restoreUser,
  upgradeUser,
  sendLoginCode,
  loginWithCode,
  loginWithGoogle,
};

export default authService;
