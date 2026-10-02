// utils/encryption.js - Field-level encryption utility
const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

// The key MUST be supplied by the environment. Previously this fell back to
// `crypto.randomBytes(32)`, which meant a fresh random key on every restart:
// every already-encrypted value (address, phone, date of birth, billing
// address, tax id) became permanently undecryptable, and the silent `null`
// return in decrypt() hid the data loss. Fail fast instead.
const loadKey = () => {
  const raw = process.env.ENCRYPTION_KEY;

  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY is not set. Generate one with " +
        "`node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"` " +
        "and add it to config.env. Field-level encryption cannot run without it."
    );
  }

  const key = Buffer.from(raw, "hex");

  // A malformed key silently produces a short/empty buffer rather than an
  // error, which would break encryption in a way that is very hard to debug.
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be 64 hex characters (32 bytes); got ${raw.length} characters.`
    );
  }

  return key;
};

let cachedKey = null;
const getKey = () => {
  if (!cachedKey) cachedKey = loadKey();
  return cachedKey;
};

const encrypt = (text) => {
  if (!text) return null;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

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
  if (
    !encryptedData ||
    !encryptedData.iv ||
    !encryptedData.data ||
    !encryptedData.authTag
  ) {
    return null;
  }

  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      getKey(),
      Buffer.from(encryptedData.iv, "hex")
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, "hex"));

    let decrypted = decipher.update(encryptedData.data, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    // GCM auth-tag failure means wrong key or tampered ciphertext. That is a
    // security-relevant event, so make it loud in the logs.
    console.error(
      "[encryption] Decryption failed (wrong ENCRYPTION_KEY or tampered data):",
      error.message
    );
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
};
