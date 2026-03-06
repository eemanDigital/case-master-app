import apiService from "../../../services/api";

const baseURL = import.meta.env.VITE_BASE_URL;
export const API_URL = `${baseURL}/users/`;

const getDashboardSummary = async () => {
  const response = await apiService.get(API_URL + "dashboard/summary");
  return response.data;
};

export default {
  getDashboardSummary,
};
