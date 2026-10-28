describe("validateEncryptionKey", () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.ENCRYPTION_KEY;
    } else {
      process.env.ENCRYPTION_KEY = originalKey;
    }
    jest.resetModules();
  });

  it("rejects a missing encryption key", () => {
    delete process.env.ENCRYPTION_KEY;
    jest.resetModules();

    const { validateEncryptionKey } = require("../utils/encryption");

    expect(() => validateEncryptionKey()).toThrow("ENCRYPTION_KEY is not set");
  });

  it("rejects a key that is not 32 bytes", () => {
    process.env.ENCRYPTION_KEY = "abc";
    jest.resetModules();

    const { validateEncryptionKey } = require("../utils/encryption");

    expect(() => validateEncryptionKey()).toThrow(
      "ENCRYPTION_KEY must be 64 hex characters",
    );
  });

  it("accepts a 32-byte hexadecimal key", () => {
    process.env.ENCRYPTION_KEY = "a".repeat(64);
    jest.resetModules();

    const { validateEncryptionKey } = require("../utils/encryption");

    expect(() => validateEncryptionKey()).not.toThrow();
  });
});
