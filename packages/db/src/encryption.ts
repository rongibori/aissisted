/**
 * Field-level encryption utility for HIPAA-compliant PII protection
 *
 * This module provides AES-256-GCM encryption for sensitive personally identifiable
 * information (PII) fields at the application layer, not the database layer.
 *
 * ENCRYPTED FIELDS (in various tables):
 * - contacts: email, firstName, lastName, dateOfBirth, phone, ipAddress
 * - consent_records: email, firstName, lastName, dateOfBirth, ipAddress
 * - users: email, firstName, lastName
 * - Any fields that might contain or relate to personal health information (PHI)
 *
 * KEY CHARACTERISTICS:
 * - Encryption happens at the application layer before data reaches the database
 * - Encrypted values are stored in the database and decrypted on retrieval
 * - Uses authenticated encryption (GCM) so tampering is detected
 * - Storage format: "base64(iv:authTag:ciphertext)" for portability
 *
 * LOOKUP STRATEGY (searchable encryption):
 * - For fields that need to be searched (e.g., "find user by email"), use hashField()
 * - hashField() returns a SHA-256 hash suitable for equality searches
 * - Store the hash in a separate column (e.g., email_hash) for lookups
 * - The original encrypted email stays in the email column
 *
 * Key source: FIELD_ENCRYPTION_KEY env var (32 raw bytes, base64-encoded)
 * Fallback: TOKEN_ENCRYPTION_KEY (for backward compatibility)
 * In development: Fixed deterministic key with console warning
 * In production: Key must be set; throws if missing
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

// ─── Key resolution ───────────────────────────────────────

const DEV_FALLBACK_KEY = Buffer.from(
  "aissisted-dev-field-encrypt-key-", // exactly 32 bytes
  "utf8"
);

function getKey(): Buffer {
  // Try primary key first
  let raw = process.env.FIELD_ENCRYPTION_KEY;

  // Fallback to token encryption key for backward compatibility
  if (!raw) {
    raw = process.env.TOKEN_ENCRYPTION_KEY;
  }

  if (raw) {
    const key = Buffer.from(raw, "base64");
    if (key.length !== 32) {
      throw new Error(
        "Encryption key must be exactly 32 bytes when base64-decoded. " +
          "Generate with: openssl rand -base64 32"
      );
    }
    return key;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "FIELD_ENCRYPTION_KEY must be set in production. " +
        "Generate with: openssl rand -base64 32"
    );
  }

  // Development fallback — safe to use only locally
  console.warn(
    "⚠️ Using development fallback key for field encryption. " +
      "Set FIELD_ENCRYPTION_KEY in production."
  );
  return DEV_FALLBACK_KEY;
}

// ─── Encrypt / decrypt ────────────────────────────────────

const SEPARATOR = ":";
// Pattern: base64 string that contains two colons separating three parts
// Each part is base64 (alphanumeric + / + =)
const ENCRYPTED_PATTERN = /^[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/;

/**
 * Encrypt a plaintext field value using AES-256-GCM.
 * Returns a base64-encoded string in format "base64(iv):base64(authTag):base64(ciphertext)".
 *
 * @param plaintext - The value to encrypt
 * @param key - Optional custom key (for testing); if not provided, uses env key
 * @returns Encrypted value as "iv:authTag:ciphertext" (all base64)
 */
export function encryptField(plaintext: string, key?: string): string {
  const encryptionKey = key
    ? Buffer.from(key, "base64")
    : getKey();

  const iv = randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16 bytes

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(SEPARATOR);
}

/**
 * Decrypt a field value encrypted with encryptField().
 * Handles graceful degradation: if the value is not in encrypted format,
 * it is returned unchanged (supports legacy plaintext values).
 *
 * @param encrypted - The encrypted value in format "iv:authTag:ciphertext" (base64)
 * @param key - Optional custom key (for testing); if not provided, uses env key
 * @returns Decrypted plaintext value, or the original if not in encrypted format
 * @throws If ciphertext has been tampered with (GCM auth tag mismatch)
 */
export function decryptField(encrypted: string, key?: string): string {
  if (!encrypted || !ENCRYPTED_PATTERN.test(encrypted)) {
    // Legacy plaintext value or invalid format — pass through
    return encrypted;
  }

  const [ivB64, authTagB64, ciphertextB64] = encrypted.split(SEPARATOR);
  const encryptionKey = key
    ? Buffer.from(key, "base64")
    : getKey();

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Hash a plaintext field using SHA-256 for searchable encrypted fields.
 * Used for lookups (e.g., find user by email hash) without exposing the plaintext.
 *
 * Always hashes the input, regardless of whether it looks encrypted or not.
 * For searches, store both the encrypted value and its hash.
 *
 * @param plaintext - The value to hash
 * @returns Base64-encoded SHA-256 hash
 */
export function hashField(plaintext: string): string {
  const hash = createHash("sha256");
  hash.update(plaintext, "utf8");
  return hash.digest("base64");
}

/**
 * Check if a string looks like our encrypted format.
 * This is a heuristic check based on format; it does not verify authentication.
 *
 * @param value - The value to check
 * @returns True if the value matches the expected encrypted format pattern
 */
export function isEncrypted(value: string): boolean {
  return !!value && ENCRYPTED_PATTERN.test(value);
}

// ─── Export types ─────────────────────────────────────────

export type FieldEncryption = {
  encryptField: typeof encryptField;
  decryptField: typeof decryptField;
  hashField: typeof hashField;
  isEncrypted: typeof isEncrypted;
};
