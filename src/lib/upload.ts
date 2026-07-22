import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/** Reject anything over ~4 MB so the database stays healthy. */
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Saves an uploaded invoice image and returns a URL for it.
 *
 * - Locally: writes to /public/uploads and returns "/uploads/…".
 * - In the cloud (Vercel has no persistent disk): stores the image
 *   inline as a base64 data URI, which lives in the database row.
 */
export async function saveUpload(file: File | null): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (file.size > MAX_BYTES) return null;

  const bytes = Buffer.from(await file.arrayBuffer());

  if (process.env.VERCEL || process.env.TURSO_DATABASE_URL) {
    const mime = file.type && file.type.startsWith("image/")
      ? file.type
      : "image/jpeg";
    return `data:${mime};base64,${bytes.toString("base64")}`;
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
  const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "jpg";
  const filename = `invoice-${Date.now()}-${Math.round(
    Math.random() * 1e6
  )}.${safeExt}`;

  await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return `/uploads/${filename}`;
}
