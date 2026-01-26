// src/utils/validation.js

/**
 * Ant Design custom password validator
 * Enforces:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validatePassword = (_, value) => {
  if (!value) {
    return Promise.reject(new Error("Password is required"));
  }

  const passwordRules = [
    {
      regex: /.{8,}/,
      message: "Password must be at least 8 characters long",
    },
    {
      regex: /[A-Z]/,
      message: "Password must contain at least one uppercase letter",
    },
    {
      regex: /[a-z]/,
      message: "Password must contain at least one lowercase letter",
    },
    {
      regex: /[0-9]/,
      message: "Password must contain at least one number",
    },
    {
      regex: /[@$!%*?&]/,
      message: "Password must contain at least one special character (@$!%*?&)",
    },
  ];

  for (const rule of passwordRules) {
    if (!rule.regex.test(value)) {
      return Promise.reject(new Error(rule.message));
    }
  }

  return Promise.resolve();
};

/**
 * Formats phone numbers into a clean international format
 * Supports Nigerian numbers primarily
 *
 * Examples:
 * 08012345678  -> +2348012345678
 * 8012345678   -> +2348012345678
 * +234 801 234 5678 -> +2348012345678
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return phone;

  // Remove spaces, dashes, brackets
  let cleaned = phone.replace(/[\s\-()]/g, "");

  // If already starts with +
  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  // Nigerian numbers
  if (cleaned.startsWith("0")) {
    return `+234${cleaned.slice(1)}`;
  }

  if (cleaned.length === 10) {
    return `+234${cleaned}`;
  }

  return cleaned;
};
