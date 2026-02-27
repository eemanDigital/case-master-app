import { useState } from "react";

const fileHeaders = {
  "Content-Type": "multipart/form-data",
};

export const useDownloadPdfHandler = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownloadPdf = async (event, apiUrl, docName) => {
    if (event) {
      event.preventDefault();
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          ...fileHeaders,
        },
        credentials: "include",
      });

      if (!response.ok) {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        throw new Error("Network response was not ok");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = docName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Download failed:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { handleDownloadPdf, loading, error };
};
