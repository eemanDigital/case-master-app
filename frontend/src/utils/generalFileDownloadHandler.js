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

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = fileName || "download";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.log(err);
  }
}
