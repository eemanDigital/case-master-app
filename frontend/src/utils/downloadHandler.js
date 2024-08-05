const fileHeaders = {
  "Content-Type": "multipart/form-data",
};

const getTokenFromCookie = () => {
  const name = "jwt="; // Replace with the actual cookie name
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
};

export const handleDownload = async (event, apiUrl, docName) => {
  event.preventDefault();
  const token = getTokenFromCookie();
  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        ...fileHeaders,
        Authorization: `Bearer ${token}`,
      },
      credentials: "include", // Allow credentials
    });

    if (!response.ok) {
      console.error(`Error: ${response.status} - ${response.statusText}`);
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
  } catch (error) {
    console.error("Download failed:", error);
  }
};
