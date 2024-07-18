const fileHeaders = {
  "Content-Type": "application/json",
};

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
        ...fileHeaders,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to download file");
    }

    const data = await response.json(); // Parse the JSON to get the data object

    console.log("RES", data);

    if (data.status === "success") {
      // Use the fileName and fileUrl from the response
      const downloadUrl = data.fileUrl;
      const downloadFileName = data.fileName || fileName; // Use the fileName from the response or fallback to the parameter
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", downloadFileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } else {
      console.error("Failed to download file:", data);
    }
  } catch (error) {
    console.error("Error fetching file:", error);
  }
}
