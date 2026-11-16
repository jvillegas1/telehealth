import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

export type EncryptedField = {
  ciphertext: string;
  iv: string;
  tag: string;
};

function keyFromEnv(encryptionKey: string): Buffer {
  if (encryptionKey.length < 32) {
    throw new Error("ENCRYPTION_KEY debe tener al menos 32 caracteres.");
  }
  return Buffer.from(encryptionKey.slice(0, 32), "utf8");
}

export function encryptField(plainText: string, encryptionKey: string): EncryptedField {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, keyFromEnv(encryptionKey), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptField(payload: EncryptedField, encryptionKey: string): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    keyFromEnv(encryptionKey),
    Buffer.from(payload.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}