import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const ENCODING = "hex";

function getKey(): Buffer {
  const key = process.env.INSTAGRAM_ENCRYPTION_KEY;
  if (!key) throw new Error("INSTAGRAM_ENCRYPTION_KEY is not configured");
  const buffer = Buffer.from(key, ENCODING);
  if (buffer.length !== KEY_LENGTH) throw new Error(`INSTAGRAM_ENCRYPTION_KEY must be ${KEY_LENGTH} hex characters`);
  return buffer;
}

export function encryptInstagramToken(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString(ENCODING)}:${authTag.toString(ENCODING)}:${encrypted.toString(ENCODING)}`;
}

export function decryptInstagramToken(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted token format");
  const iv = Buffer.from(parts[0]!, ENCODING);
  const authTag = Buffer.from(parts[1]!, ENCODING);
  const encrypted = Buffer.from(parts[2]!, ENCODING);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
