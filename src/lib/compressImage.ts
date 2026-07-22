"use client";

/**
 * Shrinks a photo on the phone before upload: max 1280px, JPEG 70%.
 * A 4 MB camera shot becomes ~150 KB — fast to upload, light in the
 * database. Non-images pass through untouched.
 */
export async function compressImage(
  file: File,
  maxDim = 1280,
  quality = 0.7
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bmp.width * scale));
    canvas.height = Math.max(1, Math.round(bmp.height * scale));
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", quality)
    );
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    return file; // any failure: upload the original
  }
}

/** Replace the files of an <input type="file"> with a compressed one. */
export async function compressInputFile(input: HTMLInputElement) {
  const f = input.files?.[0];
  if (!f) return;
  const small = await compressImage(f);
  if (small === f) return;
  const dt = new DataTransfer();
  dt.items.add(small);
  input.files = dt.files;
}
