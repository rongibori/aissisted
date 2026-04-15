/**
 * AES-256-GCM token encryption utility
 *
 * Encrypts OAuth2 access/refresh tokens before persistence in the
 * integration_tokens table. Provides authenticated encryption so any
 * tampering of the stored ciphertext is detected on decryption.
 *
 * Storage format: "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 *
 * Key source: TOKEN_ENCRYPTION_KEY env var — 32 raw bytes, base64-encoded.
 * In development (NODE_ENV !== "production") a fixed fallback key is used so
 * local dev works without extra setup. Never use the fallback key in production.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// ─── Key resolution ───────────────────────────────────────

const DEV_FALLBACK_KEY = Buffer.from(
  "aissisted-dev-token-encryption-k", // exactly 32 bytes
  "utf8"
);

function getKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (raw) {
    const key = Buffer.from(raw, "base64");
    if (key.length !== 32) {
      throw new Error(
        "TOKEN_ENCRYPTION_KEY must be exactly 32 bytes when base64-decoded"
      );
    }
    return key;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be set in production. " +
        "Generate with: openssl rand -base64 32"
    );
  }

  // Development fallback — safe to use only locally
  return DEV_FALLBACK_KEY;
}

// ─── Encrypt / decrypt ────────────────────────────────────

const SEPARATOR = ":";
const ENCRYPTED_PATTERN = /^[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/i;

/**
 * Encrypt a plaintext token value.
 * Returns "<iv_hex>:<authTag_hex>:<ciphertext_hex>".
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16 bytes

  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(
    SEPARATOR
  );
}

/**
 * Decrypt a token value produced by encrypt().
 *
 * Migration-safe: if the value does not match the encrypted format (i.e. it
 * is a legacy plaintext token), it is returned unchanged. This allows existing
 * stored tokens to continue working after deployment — they will be silently
 * re-encrypted on the next token refresh or re-auth.
 *
 * Throws if the ciphertext has been tampered with (GCM auth tag mismatch).
 */
export function decrypt(value: string): string {
  if (!value || !ENCRYPTED_PATTERN.test(value)) {
    // Legacy plaintext value — pass through for backward compatibility
    return value;
  }

  const [ivHex, authTagHex, ciphertextHex] = value.split(SEPARATOR);
  const key = getKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}
