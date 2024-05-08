import { useState } from "react";
import axios from "axios";
import { useFileContext } from "./useFileContext";
import { toast } from "react-toastify";

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";

export const useFile = () => {
  const [fileData, setFileData] = useState(null);
  const [loadingFile, setLoadingFile] = useState(true);
  const [fileError, setFileError] = useState(null);

  const { dispatch } = useFileContext();

  const fetchFile = async (
    endpoint,
    method = "GET",
    payload = null,
    customHeaders = {}
  ) => {
    try {
      setLoadingFile(true);
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

      // console.log("TOKEN", token);

      if (
        (method === "POST" || method === "PUT" || method === "PATCH") &&
        customHeaders["Content-Type"] === "multipart/form-data"
      ) {
        // If so, create a FormData object and append JSON data to it
        const formData = new FormData();
        Object.keys(fileData).forEach((key) => {
          formData.append(key, fileData[key]);
        });
      }
      const response = await axios({
        method,
        url,
        data: payload,
        headers,
        withCredentials: true,
      });

      setFileData(response?.data);
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

      localStorage.setItem("file", JSON.stringify(response.data));
      dispatch({ type: "FILEDATA", payload: response.data });
    } catch (err) {
      setFileError(err);

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
      setLoadingFile(false);
    }
  };

  return { fileData, loadingFile, fileError, fetchFile };
};
