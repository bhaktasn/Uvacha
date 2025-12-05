interface ThumbnailOptions {
  time?: number;
  width?: number;
  height?: number;
  format?: "jpg" | "png" | "webp";
}

export function getMuxThumbnailUrl(
  playbackId: string | null,
  options: ThumbnailOptions = {}
) {
  if (!playbackId) {
    return null;
  }

  const {
    time = 2,
    width,
    height,
    format = "webp",
  } = options;

  const params = new URLSearchParams();
  if (typeof time === "number") {
    params.set("time", time.toString());
  }
  if (typeof width === "number") {
    params.set("width", width.toString());
  }
  if (typeof height === "number") {
    params.set("height", height.toString());
  }

  const search = params.toString();
  const suffix = search ? `?${search}` : "";

  return `https://image.mux.com/${playbackId}/thumbnail.${format}${suffix}`;
}

