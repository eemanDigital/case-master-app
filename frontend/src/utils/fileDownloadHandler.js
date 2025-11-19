import { toast } from "react-toastify";

/**
 * Universal file download handler (binary-safe)
 * Works for both direct URLs and backend endpoints.
 */
export const downloadFile = async (
  event,
  url,
  fallbackFileName = "download"
) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  try {
    const isDirectUrl = url.startsWith("http") && !url.includes("/api/");

    // Direct download for Cloudinary or external URLs
    if (isDirectUrl) {
      const link = document.createElement("a");
      link.href = url;
      link.download = fallbackFileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // API endpoint — MUST fetch as BLOB, NEVER JSON
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    // Extract filename from header if provided
    const disposition = response.headers.get("Content-Disposition");
    let fileName = fallbackFileName;

    if (disposition && disposition.includes("filename=")) {
      fileName = disposition.split("filename=")[1].replace(/"/g, "");
    }

    // Convert response to BLOB (very important!)
    const blob = await response.blob();

    // Create a local download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    toast.success(`Downloading ${fileName}`);
  } catch (error) {
    console.error("Download error:", error);
    toast.error(error.message || "Failed to download file");
  }
};

/**
 * Delete file handler
 */
export const deleteFile = async (url, onSuccess) => {
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete file");
    }

    const data = await response.json();
    toast.success(data.message || "File deleted successfully");

    if (onSuccess) onSuccess();
  } catch (error) {
    console.error("Delete error:", error);
    toast.error(error.message || "Failed to delete file");
  }
};
