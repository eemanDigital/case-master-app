import { useState, useCallback } from "react";
import axios from "axios";

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";

export const useDataFetch = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResponse = useCallback((response) => {
    setData(response.data);
    return response.data;
  }, []);

  const handleError = useCallback((err) => {
    const { response } = err;
    const errorMessage =
      (response && response.data && response.data.message) ||
      "An error occurred";
    setError(errorMessage);

    return { error: errorMessage };
  }, []);

  const dataFetcher = useCallback(
    async (endpoint, method = "GET", payload = null) => {
      setLoading(true);
      try {
        const url = `${baseURL}/${endpoint}`;

        const response = await axios({
          method,
          url,
          data: payload,
          withCredentials: true,
        });

        return handleResponse(response);
      } catch (err) {
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [handleResponse, handleError]
  );

  return { data, loading, error, dataFetcher };
};
