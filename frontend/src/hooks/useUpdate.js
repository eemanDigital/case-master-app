import { useState } from "react";
import axios from "axios";
import { notification } from "antd";

const baseURL = import.meta.env.VITE_BASE_URL;

const useUpdate = () => {
  const [loading, setLoading] = useState(false);

  // Retrieve token from browser cookies
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("jwt="))
    ?.split("=")[1];

  const updateHeaders = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  const handleUpdate = async (url, updatedData) => {
    setLoading(true);
    try {
      await axios.patch(`${baseURL}/${url}`, updatedData, updateHeaders);
      notification.success({
        message: "Update Successful",
        description: "The task was updated successfully.",
      });
    } catch (err) {
      notification.error({
        message: "Update Failed",
        description: "There was an error updating the task.",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { handleUpdate, loading };
};

export default useUpdate;
