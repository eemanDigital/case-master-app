import { useState, useCallback } from "react";
import apiService from "../services/api";

export const useDataFetch = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResponse = useCallback((response) => {
    setData(response);
    return response;
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
        let response;
        switch (method.toUpperCase()) {
          case "GET":
            response = await apiService.get(`/api/v1/${endpoint}`);
            break;
          case "POST":
            response = await apiService.post(`/api/v1/${endpoint}`, payload);
            break;
          case "PUT":
            response = await apiService.put(`/api/v1/${endpoint}`, payload);
            break;
          case "PATCH":
            response = await apiService.patch(`/api/v1/${endpoint}`, payload);
            break;
          case "DELETE":
            response = await apiService.delete(`/api/v1/${endpoint}`);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
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
