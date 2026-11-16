import { describe, expect, it } from "vitest";

import { decryptField, encryptField } from "./field-encryption";

const TEST_KEY = "01234567890123456789012345678901";

describe("field encryption (REQ-ARCH-06)", () => {
  it("cifra y descifra sin filtrar el plaintext en errores", () => {
    const enc = encryptField('{"orientativo":true}', TEST_KEY);
    expect(enc.ciphertext).not.toContain("orientativo");
    const plain = decryptField(enc, TEST_KEY);
    expect(plain).toBe('{"orientativo":true}');
  });

  it("rechaza clave corta", () => {
    expect(() => encryptField("x", "short")).toThrow(/32 caracteres/);
  });
});