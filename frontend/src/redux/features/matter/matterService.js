import axios from "axios";

const baseURL = import.meta.env.VITE_BASE_URL;
export const API_URL = `${baseURL}/matters`;

// Get all matters
const getAllMatters = async (filters = {}) => {
  const response = await axios.get(API_URL, { params: filters });
  return response.data;
};

// Get single matter
const getMatter = async (matterId) => {
  const response = await axios.get(`${API_URL}/${matterId}`);
  return response.data;
};

// Create matter
const createMatter = async (matterData) => {
  const response = await axios.post(API_URL, matterData);
  return response.data;
};

// Update matter
const updateMatter = async ({ matterId, matterData }) => {
  const response = await axios.patch(`${API_URL}/${matterId}`, matterData);
  return response.data;
};

// Delete matter
const deleteMatter = async (matterId) => {
  const response = await axios.delete(`${API_URL}/${matterId}`);
  return response.data;
};

// Get matter statistics
const getMatterStats = async () => {
  const response = await axios.get(`${API_URL}/stats`);
  return response.data;
};

// Search matters
const searchMatters = async (searchCriteria) => {
  const response = await axios.post(`${API_URL}/search`, searchCriteria);
  return response.data;
};

const matterService = {
  getAllMatters,
  getMatter,
  createMatter,
  updateMatter,
  deleteMatter,
  getMatterStats,
  searchMatters,
};

export default matterService;
