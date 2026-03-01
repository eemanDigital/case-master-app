import axios from "axios";

const baseURL = import.meta.env.VITE_BASE_URL;
export const API_URL = `${baseURL}/`;

const deleteData = async (endpoints) => {
  const response = await axios.delete(API_URL + endpoints);
  return response.data.message;
};

const postData = async ({ endpoint, data }) => {
  const response = await axios.post(API_URL + endpoint, data);
  return response.data;
};

const putData = async ({ endpoint, data }) => {
  const response = await axios.put(API_URL + endpoint, data);
  return response.data;
};

const patchData = async ({ endpoint, data }) => {
  const response = await axios.patch(API_URL + endpoint, data);
  return response.data;
};

const deleteService = { deleteData, postData, putData, patchData };

export default deleteService;
