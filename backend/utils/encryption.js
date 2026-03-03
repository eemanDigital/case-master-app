// utils/encryption.js - Field-level encryption utility
const crypto = require("crypto");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
const IV_LENGTH = 16;
const ALGORITHM = "aes-256-gcm";

const encrypt = (text) => {
  if (!text) return null;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    data: encrypted,
    authTag: authTag.toString("hex"),
  };
};

const decrypt = (encryptedData) => {
  if (!encryptedData || !encryptedData.iv || !encryptedData.data || !encryptedData.authTag) {
    return null;
  }

  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, "hex"),
      Buffer.from(encryptedData.iv, "hex")
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, "hex"));

    let decrypted = decipher.update(encryptedData.data, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error.message);
    return null;
  }
};

const encryptField = (value) => {
  if (!value) return value;
  if (typeof value === "object") {
    return encrypt(JSON.stringify(value));
  }
  return encrypt(value.toString());
};

const decryptField = (value) => {
  if (!value) return value;
  if (typeof value === "object" && value.iv && value.data && value.authTag) {
    const decrypted = decrypt(value);
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  }
  return value;
};

const hashSensitive = (data) => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

const maskSensitiveData = (data, fields = []) => {
  const masked = { ...data };
  fields.forEach((field) => {
    if (masked[field]) {
      const value = masked[field].toString();
      if (value.length <= 4) {
        masked[field] = "***";
      } else {
        masked[field] = value.slice(0, 2) + "***" + value.slice(-2);
      }
    }
  });
  return masked;
};

module.exports = {
  encrypt,
  decrypt,
  encryptField,
  decryptField,
  hashSensitive,
  generateSecureToken,
  maskSensitiveData,
  ENCRYPTION_KEY,
};
