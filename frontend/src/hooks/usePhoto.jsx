import { useState } from "react";
import axios from "axios";
import { usePhotoContext } from "./usePhotoContext";
import { toast } from "react-toastify";

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";

export const usePhoto = () => {
  const [photoData, setPhotoData] = useState(null);
  const [loadingPhoto, setLoadingPhoto] = useState(true);
  const [photoError, setPhotoError] = useState(null);

  const { dispatch } = usePhotoContext();

  const fetchPhoto = async (
    endpoint,
    method = "GET",
    payload = null,
    customHeaders = {}
  ) => {
    try {
      setLoadingPhoto(true);
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
        Object.keys(photoData).forEach((key) => {
          formData.append(key, photoData[key]);
        });
      }
      const response = await axios({
        method,
        url,
        data: payload,
        headers,
        withCredentials: true,
      });

      setPhotoData(response?.data);
      toast.success(response?.data?.status, {
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

      localStorage.setItem("photo", JSON.stringify(response.data));
      dispatch({ type: "PHOTODATA", payload: response.data });
    } catch (err) {
      setPhotoError(err);

      const { response } = err;

      toast.error(response.data?.message, {
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
    } finally {
      setLoadingPhoto(false);
    }
  };

  return { photoData, loadingPhoto, photoError, fetchPhoto };
};
