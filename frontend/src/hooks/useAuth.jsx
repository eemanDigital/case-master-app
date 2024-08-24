import { useState } from "react";
import axios from "axios";
// import { useAuthContext } from "./useAuthContext";
import { toast } from "react-toastify";

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";

export const useAuth = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // const { dispatch } = useAuthContext();

  const authenticate = async (
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

      if (
        (method === "POST" || method === "PUT" || method === "PATCH") &&
        customHeaders["Content-Type"] === "multipart/form-data"
      ) {
        // If so, create a FormData object and append JSON data to it
        const formData = new FormData();
        Object.keys(data).forEach((key) => {
          formData.append(key, data[key]);
        });
      }
      const response = await axios({
        method,
        url,
        data: payload,
        headers,
        withCredentials: true,
      });

      setData(response.data);
      toast.success(response.data.status);

      localStorage.setItem("user", JSON.stringify(response.data));
      // dispatch({ type: "LOGIN", payload: response.data });
    } catch (err) {
      setError(err);

      const { response } = err;

      toast.error(response.data.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, authenticate };
};
