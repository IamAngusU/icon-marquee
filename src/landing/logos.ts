import type { createLogoTools, LogoThemeMode } from "./logo-tools";

export type LocalLogo = {
  label: string;
  dataUrl: string;
  maskDataUrl: string;
  automatic: boolean;
  svg: string;
  thumbnail: string;
  adaptive: boolean;
  themeMode: LogoThemeMode;
};

// Decode as an isolated image, then keep only pixels; never insert uploaded SVG markup.
export async function readLocalLogo(
  file: File,
  maxBytes: number,
  size: number,
  tools: ReturnType<typeof createLogoTools>,
): Promise<LocalLogo> {
  if (!/\.(svg|png|jpe?g|webp)$/i.test(file.name))
    throw new Error("Choose an SVG, PNG, JPEG or WebP logo.");
  if (file.size > maxBytes)
    throw new Error(
      `${file.name}: keep logos under ${Math.round(maxBytes / 1024 / 1024)} MB.`,
    );
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        image.src = "";
        reject(new Error(`${file.name}: the image took too long to load.`));
      }, 8000);
      image.onload = () => {
        clearTimeout(timeout);
        resolve();
      };
      image.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`${file.name}: this image could not be read.`));
      };
      image.src = url;
    });
    if (
      !image.naturalWidth ||
      !image.naturalHeight ||
      image.naturalWidth > 8192 ||
      image.naturalHeight > 8192
    )
      throw new Error("Logo dimensions must be between 1 and 8192 pixels.");
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare the logo.");
    const scale = Math.min(
      size / image.naturalWidth,
      size / image.naturalHeight,
    );
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.drawImage(
      image,
      (size - width) / 2,
      (size - height) / 2,
      width,
      height,
    );
    const dataUrl = canvas.toDataURL("image/png");
    const analysis = tools.analyze(
      context.getImageData(0, 0, size, size).data,
      size,
    );
    const maskImage = context.createImageData(size, size);
    maskImage.data.set(analysis.mask);
    context.putImageData(maskImage, 0, 0);
    const maskDataUrl = canvas.toDataURL("image/png");
    return {
      label: file.name.replace(/\.[^.]+$/, "").slice(0, 50),
      dataUrl,
      maskDataUrl,
      automatic: analysis.automatic,
      ...tools.render(dataUrl, maskDataUrl, analysis.automatic),
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
