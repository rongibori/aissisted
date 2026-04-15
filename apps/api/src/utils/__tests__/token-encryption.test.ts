import { describe, it, expect, beforeEach } from "vitest";
import { encrypt, decrypt } from "../token-encryption.js";

// Token encryption uses NODE_ENV to decide whether to require TOKEN_ENCRYPTION_KEY.
// Tests run with NODE_ENV=test (not production) so the dev fallback key is used.

describe("encrypt", () => {
  it("returns a string in <iv>:<authTag>:<ciphertext> format", () => {
    const result = encrypt("my-access-token");
    const parts = result.split(":");
    expect(parts).toHaveLength(3);
    // IV: 12 bytes = 24 hex chars
    expect(parts[0]).toMatch(/^[0-9a-f]{24}$/i);
    // Auth tag: 16 bytes = 32 hex chars
    expect(parts[1]).toMatch(/^[0-9a-f]{32}$/i);
    // Ciphertext: at least some hex
    expect(parts[2]).toMatch(/^[0-9a-f]+$/i);
  });

  it("produces a different ciphertext each call (random IV)", () => {
    const a = encrypt("same-token");
    const b = encrypt("same-token");
    expect(a).not.toBe(b);
  });

  it("handles tokens with special characters", () => {
    const token = "Bearer eyJhbGciOi.JIUzI1NiIs+InR5cCI6/IkpXVCJ9==";
    const encrypted = encrypt(token);
    expect(encrypted.split(":")).toHaveLength(3);
  });
});

describe("decrypt", () => {
  it("round-trips correctly — decrypt(encrypt(x)) === x", () => {
    const original = "my-secret-refresh-token-abc123";
    expect(decrypt(encrypt(original))).toBe(original);
  });

  it("round-trips with unicode content", () => {
    const token = "token-with-unicode-αβγ-🔑";
    expect(decrypt(encrypt(token))).toBe(token);
  });

  it("round-trips with long tokens (simulate JWT)", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
      "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ." +
      "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    expect(decrypt(encrypt(jwt))).toBe(jwt);
  });
});

// ─── Migration safety: plaintext pass-through ─────────────

describe("decrypt — migration safety (legacy plaintext)", () => {
  it("returns plaintext tokens unchanged (no colon-separated format)", () => {
    const legacy = "ya29.a0AfH6SMBU_some_legacy_oauth_token";
    expect(decrypt(legacy)).toBe(legacy);
  });

  it("returns empty-ish string unchanged (no ENCRYPTED_PATTERN match)", () => {
    // Note: empty string does not match ENCRYPTED_PATTERN so passes through
    expect(decrypt("")).toBe("");
  });

  it("passes through tokens that look like OAuth tokens", () => {
    const token = "whoop_access_token_v2_abc123xyz456";
    expect(decrypt(token)).toBe(token);
  });

  it("does not confuse URL-like strings with encrypted format", () => {
    // URLs have colons but not the hex pattern
    const url = "https://api.example.com/token";
    expect(decrypt(url)).toBe(url);
  });
});

// ─── Multiple round-trips ─────────────────────────────────

describe("multiple round-trips", () => {
  it("produces consistent output over many iterations", () => {
    const tokens = [
      "access_token_1",
      "refresh_token_long_value_abc",
      "Bearer short",
      "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEyMyJ9.signature",
    ];
    for (const token of tokens) {
      expect(decrypt(encrypt(token))).toBe(token);
    }
  });
});
