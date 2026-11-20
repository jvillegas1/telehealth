import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export async function saveCredentialDocument(params: {
  file: File;
  professionalId: string;
}): Promise<{ storageKey: string; sizeBytes: number; mimeType: string; fileName: string }> {
  if (params.file.size > MAX_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }
  if (!ALLOWED.has(params.file.type)) {
    throw new Error("INVALID_TYPE");
  }

  const root = path.join(process.cwd(), "uploads", "credentials", params.professionalId);
  await mkdir(root, { recursive: true });
  const ext = path.extname(params.file.name) || ".bin";
  const storageKey = `${randomUUID()}${ext}`;
  const dest = path.join(root, storageKey);
  const buffer = Buffer.from(await params.file.arrayBuffer());
  await writeFile(dest, buffer);

  return {
    storageKey,
    sizeBytes: buffer.length,
    mimeType: params.file.type,
    fileName: params.file.name,
  };
}

export async function readCredentialDocument(params: {
  professionalId: string;
  storageKey: string;
}): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
  const root = path.join(process.cwd(), "uploads", "credentials", params.professionalId);
  const dest = path.join(root, params.storageKey);
  const buffer = await readFile(dest);
  const mimeType = params.storageKey.endsWith(".pdf")
    ? "application/pdf"
    : params.storageKey.endsWith(".png")
      ? "image/png"
      : "image/jpeg";
  return { buffer, mimeType, fileName: params.storageKey };
}

export async function saveProfessionalPhoto(params: {
  file: File;
  professionalId: string;
}): Promise<{ photoUrl: string }> {
  if (params.file.size > MAX_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }
  if (!params.file.type.startsWith("image/")) {
    throw new Error("INVALID_TYPE");
  }

  const root = path.join(process.cwd(), "public", "uploads", "professionals");
  await mkdir(root, { recursive: true });
  const ext = path.extname(params.file.name) || ".jpg";
  const name = `${params.professionalId}${ext}`;
  const dest = path.join(root, name);
  const buffer = Buffer.from(await params.file.arrayBuffer());
  await writeFile(dest, buffer);

  return { photoUrl: `/uploads/professionals/${name}` };
}
