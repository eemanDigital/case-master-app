import axios from "axios";

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";
const API_URL = `${baseURL}/notes`;

const getAuthConfig = () => ({
  withCredentials: true,
});

export const getNotes = async (params = {}) => {
  const response = await axios.get(API_URL, { 
    params,
    ...getAuthConfig() 
  });
  return response.data;
};

export const getNote = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, getAuthConfig());
  return response.data;
};

export const createNote = async (noteData) => {
  const response = await axios.post(API_URL, noteData, getAuthConfig());
  return response.data;
};

export const updateNote = async (id, noteData) => {
  const response = await axios.patch(`${API_URL}/${id}`, noteData, getAuthConfig());
  return response.data;
};

export const deleteNote = async (id, hard = false) => {
  const response = await axios.delete(`${API_URL}/${id}`, { 
    params: { hard },
    ...getAuthConfig() 
  });
  return response.data;
};

export const restoreNote = async (id) => {
  const response = await axios.patch(`${API_URL}/${id}/restore`, {}, getAuthConfig());
  return response.data;
};

export const togglePin = async (id) => {
  const response = await axios.patch(`${API_URL}/${id}/pin`, {}, getAuthConfig());
  return response.data;
};

export const toggleFavorite = async (id) => {
  const response = await axios.patch(`${API_URL}/${id}/favorite`, {}, getAuthConfig());
  return response.data;
};

export const getTrashNotes = async (params = {}) => {
  const response = await axios.get(`${API_URL}/trash`, { 
    params,
    ...getAuthConfig() 
  });
  return response.data;
};

export const getNoteStats = async () => {
  const response = await axios.get(`${API_URL}/stats`, getAuthConfig());
  return response.data;
};

const notesService = {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  restoreNote,
  togglePin,
  toggleFavorite,
  getTrashNotes,
  getNoteStats,
};

export default notesService;
