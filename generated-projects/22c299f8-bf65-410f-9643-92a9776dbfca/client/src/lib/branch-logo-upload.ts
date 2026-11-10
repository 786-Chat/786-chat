/**
 * Keep branch-logo POST/PATCH payloads below Vercel's function-body limit.
 * Compress large raster images before sending them through a function.
 * Preserve the existing branch; never overwrite a logo if preparation fails.
 */
const TARGET_BYTES = 350 * 1024;
const MAX_ORIGINAL_BYTES = 10 * 1024 * 1024;
// Larger GIFs are sent directly to private Blob storage so animation stays intact
// without putting the raw file in a function request or database JSON response.
export const MAX_ANIMATED_GIF_BYTES = 10 * 1024 * 1024;
const RASTER_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"]);
const ALLOWED_TYPES = new Set([...RASTER_TYPES, "image/svg+xml"]);

export async function prepareBranchLogoUpload(file: File): Promise<File> {
  if (!file || !ALLOWED_TYPES.has(file.type)) {
    throw new Error("Please choose a PNG, JPG, GIF, WebP or SVG logo.");
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    throw new Error("The original logo is over 10 MB. Please resize it before uploading.");
  }
  // Preserve *all* frames and timing. ImageBitmap/canvas only reads the first
  // animated GIF frame, so an animated GIF must go through unchanged.
  if (file.type === "image/gif") {
    if (file.size > MAX_ANIMATED_GIF_BYTES) {
      throw new Error("Animated GIF is over 10 MB. Please optimise the animation before uploading; converting it to JPG/PNG would remove its animation.");
    }
    return file;
  }
  // Small existing formats remain unchanged, including transparent SVG.
  if (file.size <= TARGET_BYTES) return file;
  if (file.type === "image/svg+xml") {
    throw new Error("This SVG logo is too large. Save it as PNG/JPG, then select it again.");
  }
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    throw new Error("Your browser cannot compress this logo. Please use a JPG/PNG under 350 KB.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("The logo could not be opened. Please use a valid JPG or PNG image.");
  }

  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx || !bitmap.width || !bitmap.height) {
      throw new Error("Could not resize this logo. Please use a JPG/PNG under 350 KB.");
    }
    const stem = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 70) || "branch-logo";
    for (const maxSide of [900, 700, 500, 350]) {
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.82, 0.68, 0.52]) {
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", quality));
        // Reject browser fallback formats to ensure the server accepts the file.
        if (blob?.type === "image/webp" && blob.size > 0 && blob.size <= TARGET_BYTES) {
          return new File([blob], stem + ".webp", { type: "image/webp", lastModified: Date.now() });
        }
      }
    }
    throw new Error("Could not make this logo small enough. Please resize it to 500 × 500 pixels and try again.");
  } finally {
    bitmap.close();
  }
}

/**
 * Preserve original GIF bytes and animation. Upload in 1MB authenticated
 * pieces, then ask the server to combine them in PRIVATE Blob storage.
 * Individual Function requests never hit Vercel's 4.5MB payload limit.
 * A failed upload does not change the existing branch logo.
 */
export async function uploadOriginalBranchGif(file: File, branchId: string): Promise<void> {
  if (file.type !== "image/gif" || file.size <= 0 || file.size > MAX_ANIMATED_GIF_BYTES) {
    throw new Error("Choose an original animated GIF up to 10 MB.");
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(branchId)) {
    throw new Error("Invalid branch ID for logo upload.");
  }
  const chunkBytes = 1024 * 1024;
  const partsCount = Math.ceil(file.size / chunkBytes);
  const uploadId = crypto.randomUUID();
  let completed = false;
  try {
    for (let index = 0; index < partsCount; index++) {
      const chunk = file.slice(index * chunkBytes, Math.min(file.size, (index + 1) * chunkBytes));
      const response = await fetch(
        "/api/branches/" + branchId + "/logo/gif-chunk/" + uploadId + "/" + index,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/octet-stream" },
          body: chunk,
        }
      );
      if (!response.ok) {
        throw new Error("Animated GIF upload failed at part " + (index + 1) + " of " + partsCount + ". Your branch record is preserved.");
      }
    }
    const response = await fetch("/api/branches/" + branchId + "/logo/gif-complete", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId, totalSize: file.size, partsCount }),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.message || "GIF could not be saved. Your existing shop record is preserved.");
    }
    completed = true;
  } finally {
    if (!completed) {
      // Best-effort cleanup of incomplete chunks; never erase an existing logo.
      await fetch("/api/branches/" + branchId + "/logo/gif-chunks/" + uploadId, {
        method: "DELETE",
        credentials: "include",
      }).catch(() => undefined);
    }
  }
}
