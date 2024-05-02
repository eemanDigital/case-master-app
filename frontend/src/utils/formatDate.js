export function formatYear(date) {
  const formattedDate = new Date(date);
  return formattedDate.getFullYear();
}

export function formatDate(date) {
  const newDate = new Date(date);

  const options = { year: "numeric", month: "long", day: "numeric" };
  const formattedDate = new Intl.DateTimeFormat("en-US", options).format(
    newDate
  );

  return formattedDate;
}
