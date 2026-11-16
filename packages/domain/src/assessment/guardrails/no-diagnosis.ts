/** Patrones prohibidos en salida orientativa (REQ-ETH-01). */
const FORBIDDEN_PATTERNS: RegExp[] = [
  /\btienes\b.{0,40}\b(trastorno|depresión|ansiedad|bipolar|esquizofrenia|toc|tdah)\b/i,
  /\bpadeces\b/i,
  /\bsufres de\b/i,
  /\bdiagnóstico\b/i,
  /\bconclusión clínica\b/i,
  /\btrastorno\b/i,
  /\bdsm[-\s]?\d/i,
  /\bcie[-\s]?10\b/i,
  /\bcie[-\s]?11\b/i,
];

export function containsClinicalDiagnosis(text: string): boolean {
  return FORBIDDEN_PATTERNS.some((pattern) => pattern.test(text));
}

export function validateOrientativeCopy(parts: string[]): boolean {
  const joined = parts.join("\n");
  return !containsClinicalDiagnosis(joined);
}