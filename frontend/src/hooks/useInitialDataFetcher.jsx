import axios from "axios";
import { useEffect, useState } from "react";

const baseURL = import.meta.env.VITE_BASE_URL;

const useInitialDataFetcher = (endpoint, id) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${baseURL}/${endpoint}/${id}`);
        // console.log("RES", response.data.data);

        setFormData((prevData) => {
          return {
            ...prevData,
            ...response?.data?.data,
          };
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, endpoint]);

  return { formData, loading };
};

export default useInitialDataFetcher;
