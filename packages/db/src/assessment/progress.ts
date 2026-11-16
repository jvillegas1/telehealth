import type { StepAnswers } from "@telehealth/domain";

import { decryptField, encryptField } from "../crypto/field-encryption";

export function encryptProgress(answers: StepAnswers, encryptionKey: string) {
  return encryptField(JSON.stringify(answers), encryptionKey);
}

export function decryptProgress(
  payload: { ciphertext: string; iv: string; tag: string },
  encryptionKey: string,
): StepAnswers {
  return JSON.parse(decryptField(payload, encryptionKey)) as StepAnswers;
}