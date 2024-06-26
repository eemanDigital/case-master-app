import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";

export const useDataFetch = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dataFetcher = async (
    endpoint,
    method = "GET",
    payload = null,
    customHeaders = {}
  ) => {
    try {
      setLoading(true);
      const url = `${baseURL}/${endpoint}`;

      // Retrieve token from browser cookies
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("jwt="))
        ?.split("=")[1];

      // Merge custom headers with default headers
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...customHeaders,
      };

      const response = await axios({
        method,
        url,
        data: payload,
        headers,
        withCredentials: true,
      });

      setData(response.data);
      toast.success(response.data.status, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: 12,
        progress: undefined,
        theme: "light",
      });

      return response.data;
    } catch (err) {
      setError(err);

      const { response } = err;

      toast.error(response?.data?.message, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: 11,
        progress: undefined,
        theme: "light",
      });

      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, dataFetcher };
};
