// Add this function to your component or utilities file
export const capitalizeWords = (str) => {
  if (!str || typeof str !== "string") return str || "";

  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Or for single words only:
export const capitalizeFirstLetter = (str) => {
  if (!str || typeof str !== "string") return str || "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
