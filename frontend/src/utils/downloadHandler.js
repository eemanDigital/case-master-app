// Download invoice handler
const fileHeaders = {
  "Content-Type": "multipart/form-data",
};

// Retrieve token from browser cookies
const token = document.cookie
  .split("; ")
  .find((row) => row.startsWith("jwt="))
  ?.split("=")[1];

export const handleDownload = async (event, apiUrl, docName) => {
  event.preventDefault();
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      ...fileHeaders,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = docName; // or any other filename you want
  document.body.appendChild(a);
  a.click();
  a.remove();
};
