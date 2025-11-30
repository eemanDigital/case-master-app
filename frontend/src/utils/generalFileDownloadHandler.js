import { notification } from "antd";

/**
 * Universal file download handler that works with both AWS S3 URLs and API endpoints
 */
export async function handleGeneralDownload(
  event,
  downloadData,
  fileName = null
) {
  event.preventDefault();

  try {
    // Handle different input types
    let downloadUrl, downloadFileName;

    if (typeof downloadData === "string") {
      // Case 1: Direct URL provided
      downloadUrl = downloadData;
      downloadFileName = fileName;
    } else if (downloadData?.fileUrl) {
      // Case 2: Document object with fileUrl
      downloadUrl = downloadData.fileUrl;
      downloadFileName = downloadData.fileName || fileName;
    } else if (downloadData?.url) {
      // Case 3: Object with url property
      downloadUrl = downloadData.url;
      downloadFileName = downloadData.fileName || fileName;
    } else {
      throw new Error("Invalid download data provided");
    }

    // If it's an AWS S3 URL, handle it directly
    if (downloadUrl.includes("amazonaws.com") || downloadUrl.includes("s3.")) {
      await downloadFromS3(downloadUrl, downloadFileName);
    } else if (downloadUrl.startsWith("http")) {
      // Direct HTTP URL
      await downloadDirectUrl(downloadUrl, downloadFileName);
    } else {
      // API endpoint - get signed URL or file data
      await downloadFromAPI(downloadUrl, downloadFileName);
    }
  } catch (error) {
    console.error("Download error:", error);
    notification.error({
      message: "Download Failed",
      description:
        error.message || "Failed to download file. Please try again.",
    });
  }
}

/**
 * Download file directly from AWS S3 URL
 */
async function downloadFromS3(s3Url, fileName) {
  try {
    // For S3 URLs, we can use a direct download approach
    const link = document.createElement("a");
    link.href = s3Url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    if (fileName) {
      link.download = fileName;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show success notification
    notification.success({
      message: "Download Started",
      description: `Downloading ${fileName || "file"}...`,
    });
  } catch (error) {
    throw new Error(`S3 download failed: ${error.message}`);
  }
}

/**
 * Download from direct HTTP URL
 */
async function downloadDirectUrl(url, fileName) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch file");

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();

    // Cleanup
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(link);

    notification.success({
      message: "Download Complete",
      description: `Downloaded ${fileName || "file"} successfully.`,
    });
  } catch (error) {
    throw new Error(`Direct download failed: ${error.message}`);
  }
}

/**
 * Download from API endpoint (gets signed URL or file data)
 */
async function downloadFromAPI(apiUrl, fileName) {
  try {
    const token = getAuthToken();
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to get download information");

    const data = await response.json();

    if (data.data?.downloadUrl) {
      // API returned a pre-signed URL
      await downloadFromS3(
        data.data.downloadUrl,
        fileName || data.data.fileName
      );
    } else if (data.data?.fileUrl) {
      // API returned a file URL
      await downloadFromS3(data.data.fileUrl, fileName || data.data.fileName);
    } else {
      throw new Error("No download URL provided by API");
    }
  } catch (error) {
    throw new Error(`API download failed: ${error.message}`);
  }
}

/**
 * Get authentication token from cookies
 */
function getAuthToken() {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("jwt="))
    ?.split("=")[1];
}
