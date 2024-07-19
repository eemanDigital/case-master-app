// Retrieve token from browser cookies
const token = document.cookie
  .split("; ")
  .find((row) => row.startsWith("jwt="))
  ?.split("=")[1];

export async function handleGeneralDownload(event, URL, fileName) {
  event.preventDefault();
  try {
    const response = await fetch(URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to download file");
    }

    const data = await response.json();
    if (data.status === "success") {
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
