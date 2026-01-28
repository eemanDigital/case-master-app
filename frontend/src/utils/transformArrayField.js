// Add this helper function at the top of your component (outside the memo function):
export const transformArrayField = (fieldArray) => {
  return (fieldArray || [])
    .filter((item) => {
      if (!item) return false;
      if (typeof item === "string") return item.trim().length > 0;
      if (item && typeof item === "object" && item.name) {
        return item.name.trim().length > 0;
      }
      return false;
    })
    .map((item) => {
      if (typeof item === "string") return { name: item.trim() };
      if (item && typeof item === "object" && item.name) {
        return { name: item.name.trim() };
      }
      return { name: "" };
    })
    .filter((item) => item.name.length > 0); // Final safety check
};
