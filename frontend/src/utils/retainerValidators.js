export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[\+]?[1-9][\d]{0,15}$/;
  return re.test(phone.replace(/[\s\-\(\)]/g, ""));
};

export const validateRequired = (value) => {
  return value !== undefined && value !== null && value !== "";
};

export const validateNumber = (value, min = 0, max = null) => {
  if (value === undefined || value === null || value === "") return false;
  const num = Number(value);
  if (isNaN(num)) return false;
  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;
  return true;
};

export const validateDate = (date, minDate = null, maxDate = null) => {
  if (!date) return false;
  const dayjs = require("dayjs");
  const d = dayjs(date);
  if (!d.isValid()) return false;
  if (minDate && d.isBefore(dayjs(minDate))) return false;
  if (maxDate && d.isAfter(dayjs(maxDate))) return false;
  return true;
};
