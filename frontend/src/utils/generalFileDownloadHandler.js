// Retrieve token from browser cookies

export async function handleGeneralDownload(event, URL, fileName) {
  event.preventDefault();
  try {
    const response = await fetch(URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to download file");
    }

    const data = await response.json();
    if (data.message === "success") {
      const downloadUrl = `${data.data.fileUrl}?attachment=true`;
      const originalFileName = data.data.fileName || fileName;
      const fileExtension = downloadUrl.split(".").pop();
      const downloadFileName = originalFileName.includes(".")
        ? originalFileName
        : `${originalFileName}.${fileExtension}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error("Failed to download file:", data);
    }
  } catch (error) {
    console.error("Error fetching file:", error);
  }
}

// task response download handler
export const handleTaskResponseDownload = (
  event,
  fileUrl,
  fileName = "download"
) => {
  event.preventDefault();
  try {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute("download", fileName); // Set the download attribute
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); // Clean up after download
  } catch (error) {
    console.error("Error downloading file:", error);
  }
};
