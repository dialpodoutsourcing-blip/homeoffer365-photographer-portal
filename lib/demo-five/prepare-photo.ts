export type PreparedPhoto = {
  blob: Blob;
  width: number;
  height: number;
  mimeType: "image/webp" | "image/jpeg";
  byteSize: number;
};

type PhotoCanvas = {
  getContext(kind: "2d"): Pick<CanvasRenderingContext2D, "drawImage"> | null;
  toBlob(callback: BlobCallback, type: string, quality: number): void;
};

export type BrowserImageTools = {
  createImageBitmap(file: Blob, options: { imageOrientation: "from-image" }): Promise<ImageBitmap>;
  createCanvas(width: number, height: number): PhotoCanvas;
};

const browserImageTools: BrowserImageTools = {
  createImageBitmap(file, options) {
    if (typeof globalThis.createImageBitmap !== "function") {
      throw new Error("Image decoding is unavailable in this browser.");
    }
    return globalThis.createImageBitmap(file, options);
  },
  createCanvas(width, height) {
    if (typeof document === "undefined") throw new Error("Image canvas is unavailable in this browser.");
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  },
};

function encode(canvas: PhotoCanvas, mimeType: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(resolve, mimeType, quality);
    } catch {
      resolve(null);
    }
  });
}

function usable(blob: Blob | null, mimeType: string): blob is Blob {
  return blob instanceof Blob && blob.size > 0 && blob.type === mimeType;
}

export async function preparePhoto(file: Blob, tools: BrowserImageTools = browserImageTools): Promise<PreparedPhoto> {
  if (!(file instanceof Blob) || !file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size === 0) throw new Error("The selected image is empty. Capture or choose another image.");
  if (file.size > 30 * 1024 * 1024) throw new Error("The original image must be 30 MiB or smaller.");

  // The browser applies EXIF orientation before these dimensions and pixels are read.
  const bitmap = await tools.createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    if (!Number.isSafeInteger(bitmap.width) || !Number.isSafeInteger(bitmap.height) || bitmap.width <= 0 || bitmap.height <= 0) {
      throw new Error("The image has invalid dimensions.");
    }
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = tools.createCanvas(width, height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image canvas is unavailable in this browser.");
    context.drawImage(bitmap, 0, 0, width, height);

    let mimeType: PreparedPhoto["mimeType"] = "image/webp";
    let blob = await encode(canvas, mimeType, 0.82);
    if (!usable(blob, mimeType)) {
      mimeType = "image/jpeg";
      blob = await encode(canvas, mimeType, 0.84);
    }
    if (!usable(blob, mimeType)) throw new Error("Could not encode this image. Capture or choose another image.");
    if (blob.size > 10 * 1024 * 1024) throw new Error("The prepared image exceeds 10 MiB. Choose a smaller image.");
    return { blob, width, height, mimeType, byteSize: blob.size };
  } finally {
    bitmap.close();
  }
}
