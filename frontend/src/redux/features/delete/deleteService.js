import axios from "axios";

const baseURL = import.meta.env.VITE_BASE_URL;
export const API_URL = `${baseURL}/`;

// register/add user
const deleteData = async (endpoints) => {
  const response = await axios.delete(API_URL + endpoints);

  console.log("DEL MSG", response.data);
  return response.data.message;
};

const deleteService = { deleteData };

export default deleteService;
