"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@/components/ui";

type Slice = {
  id: string;
  filename: string;
  previewUrl: string;
  blob: Blob;
  row: number;
  col: number;
};

type DragTarget =
  | { kind: "trim-left" }
  | { kind: "trim-right" }
  | { kind: "trim-top" }
  | { kind: "trim-bottom" }
  | { kind: "vertical-guide"; index: number }
  | { kind: "horizontal-guide"; index: number };

const MAX_GRID_SIZE = 20;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function buildEvenGuides(segmentCount: number, totalSize: number) {
  if (segmentCount <= 1 || totalSize <= 1) return [];
  const guides: number[] = [];
  for (let i = 1; i < segmentCount; i += 1) {
    guides.push(Math.round((i * totalSize) / segmentCount));
  }
  return guides;
}

function reconcileGuides(prev: number[], guideCount: number, totalSize: number) {
  if (guideCount <= 0 || totalSize <= 1) return [];
  if (prev.length !== guideCount) {
    return buildEvenGuides(guideCount + 1, totalSize);
  }

  const next = prev.slice();
  for (let i = 0; i < next.length; i += 1) {
    const min = i === 0 ? 1 : next[i - 1] + 1;
    const max = i === next.length - 1 ? totalSize - 1 : next[i + 1] - 1;
    next[i] = clamp(next[i], min, Math.max(min, max));
  }
  return next;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function makeSliceFilename(baseName: string, row: number, col: number) {
  return `${baseName}-r${row}-c${col}.png`;
}

export function StoryboardSplitter() {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(2);
  const [fileName, setFileName] = useState("storyboard");
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [slices, setSlices] = useState<Slice[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceWidth, setSourceWidth] = useState(0);
  const [sourceHeight, setSourceHeight] = useState(0);
  const [trimLeft, setTrimLeft] = useState(0);
  const [trimRight, setTrimRight] = useState(0);
  const [trimTop, setTrimTop] = useState(0);
  const [trimBottom, setTrimBottom] = useState(0);
  const [verticalGuides, setVerticalGuides] = useState<number[]>([]);
  const [horizontalGuides, setHorizontalGuides] = useState<number[]>([]);
  const [activeDrag, setActiveDrag] = useState<DragTarget | null>(null);
  const previewFrameRef = useRef<HTMLDivElement | null>(null);

  const expectedCount = useMemo(() => rows * cols, [rows, cols]);
  const canAdjustCrop = sourceWidth > 0 && sourceHeight > 0;
  const cropWidth = sourceWidth - trimLeft - trimRight;
  const cropHeight = sourceHeight - trimTop - trimBottom;
  const previewVerticalGuides = useMemo(
    () => reconcileGuides(verticalGuides, Math.max(0, cols - 1), Math.max(0, cropWidth)),
    [verticalGuides, cols, cropWidth]
  );
  const previewHorizontalGuides = useMemo(
    () => reconcileGuides(horizontalGuides, Math.max(0, rows - 1), Math.max(0, cropHeight)),
    [horizontalGuides, rows, cropHeight]
  );

  useEffect(() => {
    return () => {
      if (sourceImageUrl) {
        URL.revokeObjectURL(sourceImageUrl);
      }
    };
  }, [sourceImageUrl]);

  useEffect(() => {
    setVerticalGuides((prev) => reconcileGuides(prev, Math.max(0, cols - 1), Math.max(0, cropWidth)));
  }, [cols, cropWidth]);

  useEffect(() => {
    setHorizontalGuides((prev) => reconcileGuides(prev, Math.max(0, rows - 1), Math.max(0, cropHeight)));
  }, [rows, cropHeight]);

  const clearPreviousSlices = () => {
    setSlices((prev) => {
      prev.forEach((slice) => URL.revokeObjectURL(slice.previewUrl));
      return [];
    });
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setError(null);
    clearPreviousSlices();

    if (sourceImageUrl) {
      URL.revokeObjectURL(sourceImageUrl);
    }

    const nextUrl = URL.createObjectURL(selected);
    setSourceImageUrl(nextUrl);

    const nameWithoutExt = selected.name.replace(/\.[^/.]+$/, "").trim();
    if (nameWithoutExt) {
      setFileName(nameWithoutExt);
    }

    const img = new Image();
    img.onload = () => {
      setSourceWidth(img.naturalWidth || 0);
      setSourceHeight(img.naturalHeight || 0);
      setTrimLeft(0);
      setTrimRight(0);
      setTrimTop(0);
      setTrimBottom(0);
      setVerticalGuides([]);
      setHorizontalGuides([]);
    };
    img.src = nextUrl;
  };

  const updateVerticalGuide = (index: number, value: number) => {
    setVerticalGuides((prev) => {
      const next = reconcileGuides(prev, Math.max(0, cols - 1), Math.max(0, cropWidth));
      if (index < 0 || index >= next.length) return next;
      const min = index === 0 ? 1 : next[index - 1] + 1;
      const max = index === next.length - 1 ? cropWidth - 1 : next[index + 1] - 1;
      next[index] = clamp(value, min, Math.max(min, max));
      return next;
    });
  };

  const updateHorizontalGuide = (index: number, value: number) => {
    setHorizontalGuides((prev) => {
      const next = reconcileGuides(prev, Math.max(0, rows - 1), Math.max(0, cropHeight));
      if (index < 0 || index >= next.length) return next;
      const min = index === 0 ? 1 : next[index - 1] + 1;
      const max = index === next.length - 1 ? cropHeight - 1 : next[index + 1] - 1;
      next[index] = clamp(value, min, Math.max(min, max));
      return next;
    });
  };

  const getPreviewPoint = (clientX: number, clientY: number) => {
    const frame = previewFrameRef.current;
    if (!frame || !sourceWidth || !sourceHeight) return null;

    const rect = frame.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    return {
      x: clamp(Math.round(((clientX - rect.left) / rect.width) * sourceWidth), 0, sourceWidth),
      y: clamp(Math.round(((clientY - rect.top) / rect.height) * sourceHeight), 0, sourceHeight),
    };
  };

  const applyDrag = (target: DragTarget, clientX: number, clientY: number) => {
    const point = getPreviewPoint(clientX, clientY);
    if (!point) return;

    if (target.kind === "trim-left") {
      setTrimLeft(clamp(point.x, 0, Math.max(0, sourceWidth - trimRight - 1)));
      return;
    }

    if (target.kind === "trim-right") {
      const x = clamp(point.x, Math.min(sourceWidth, trimLeft + 1), sourceWidth);
      setTrimRight(clamp(sourceWidth - x, 0, Math.max(0, sourceWidth - trimLeft - 1)));
      return;
    }

    if (target.kind === "trim-top") {
      setTrimTop(clamp(point.y, 0, Math.max(0, sourceHeight - trimBottom - 1)));
      return;
    }

    if (target.kind === "trim-bottom") {
      const y = clamp(point.y, Math.min(sourceHeight, trimTop + 1), sourceHeight);
      setTrimBottom(clamp(sourceHeight - y, 0, Math.max(0, sourceHeight - trimTop - 1)));
      return;
    }

    if (target.kind === "vertical-guide") {
      updateVerticalGuide(target.index, point.x - trimLeft);
      return;
    }

    updateHorizontalGuide(target.index, point.y - trimTop);
  };

  const startDrag = (event: React.PointerEvent<HTMLElement>, target: DragTarget) => {
    event.preventDefault();
    event.stopPropagation();
    previewFrameRef.current?.setPointerCapture(event.pointerId);
    setActiveDrag(target);
    applyDrag(target, event.clientX, event.clientY);
  };

  const stopDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (previewFrameRef.current?.hasPointerCapture(event.pointerId)) {
      previewFrameRef.current.releasePointerCapture(event.pointerId);
    }
    setActiveDrag(null);
  };

  const splitStoryboard = async () => {
    if (!sourceImageUrl) {
      setError("Upload a storyboard image first.");
      return;
    }

    if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1) {
      setError("Rows and columns must be positive whole numbers.");
      return;
    }

    if (rows > MAX_GRID_SIZE || cols > MAX_GRID_SIZE) {
      setError(`Rows and columns must be ${MAX_GRID_SIZE} or less.`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not read the uploaded image."));
        img.src = sourceImageUrl;
      });

      const imgWidth = image.naturalWidth;
      const imgHeight = image.naturalHeight;

      if (!imgWidth || !imgHeight) {
        throw new Error("Invalid image dimensions.");
      }

      const safeTrimLeft = clamp(trimLeft, 0, Math.max(0, imgWidth - trimRight - 1));
      const safeTrimRight = clamp(trimRight, 0, Math.max(0, imgWidth - safeTrimLeft - 1));
      const safeTrimTop = clamp(trimTop, 0, Math.max(0, imgHeight - trimBottom - 1));
      const safeTrimBottom = clamp(trimBottom, 0, Math.max(0, imgHeight - safeTrimTop - 1));

      const cropX = safeTrimLeft;
      const cropY = safeTrimTop;
      const croppedWidth = imgWidth - safeTrimLeft - safeTrimRight;
      const croppedHeight = imgHeight - safeTrimTop - safeTrimBottom;

      if (croppedWidth <= 0 || croppedHeight <= 0) {
        throw new Error("Crop area is too small. Reduce trim values.");
      }

      clearPreviousSlices();

      const generated: Slice[] = [];
      const xGuides = reconcileGuides(verticalGuides, Math.max(0, cols - 1), croppedWidth);
      const yGuides = reconcileGuides(horizontalGuides, Math.max(0, rows - 1), croppedHeight);
      const xStops = [cropX, ...xGuides.map((g) => cropX + g), cropX + croppedWidth];
      const yStops = [cropY, ...yGuides.map((g) => cropY + g), cropY + croppedHeight];

      for (let row = 0; row < rows; row += 1) {
        const yStart = yStops[row];
        const yEnd = yStops[row + 1];
        const panelHeight = yEnd - yStart;

        for (let col = 0; col < cols; col += 1) {
          const xStart = xStops[col];
          const xEnd = xStops[col + 1];
          const panelWidth = xEnd - xStart;

          const canvas = document.createElement("canvas");
          canvas.width = panelWidth;
          canvas.height = panelHeight;

          const context = canvas.getContext("2d");
          if (!context) {
            throw new Error("Canvas is not supported in this browser.");
          }

          context.drawImage(
            image,
            xStart,
            yStart,
            panelWidth,
            panelHeight,
            0,
            0,
            panelWidth,
            panelHeight
          );

          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((nextBlob) => {
              if (nextBlob) resolve(nextBlob);
              else reject(new Error("Failed to create one of the panel images."));
            }, "image/png");
          });

          const id = `${row + 1}-${col + 1}`;
          const filename = makeSliceFilename(fileName || "storyboard", row + 1, col + 1);
          const previewUrl = URL.createObjectURL(blob);

          generated.push({
            id,
            filename,
            previewUrl,
            blob,
            row: row + 1,
            col: col + 1,
          });
        }
      }

      setSlices(generated);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to split image.";
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAll = async () => {
    for (let i = 0; i < slices.length; i += 1) {
      downloadBlob(slices[i].blob, slices[i].filename);
      // Slight spacing helps browsers handle multiple downloads.
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  };

  return (
    <div className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute inset-x-0 top-10 mx-auto h-72 w-[80%] rounded-[50%] bg-[#f5d67b]/5 blur-[200px]" />
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:py-6 space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50 hover:text-[#f5d67b] transition mb-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Back to Tools
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#f5d67b]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M12 3v18" />
                <path d="M3 12h18" />
              </svg>
              Storyboard Image Splitter
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-white md:text-4xl">
              Split storyboard sheets into panel images
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60 md:text-base">
              Upload one storyboard image, set the grid size, and download each panel as a separate PNG.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/35 shadow-[0_20px_60px_rgba(0,0,0,0.42)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
              <div>
                <h2 className="text-base font-semibold text-white">Source Preview</h2>
                <div className="text-xs text-white/45">
                  {sourceImageUrl && canAdjustCrop
                    ? `${sourceWidth} x ${sourceHeight}px source | ${Math.max(0, cropWidth)} x ${Math.max(0, cropHeight)}px crop`
                    : "Upload a storyboard sheet to begin"}
                </div>
              </div>
              {sourceImageUrl && (
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span className="rounded-full border border-[#f5d67b]/30 bg-[#f5d67b]/10 px-2.5 py-1 text-[#ffe8a0]">
                    Trim
                  </span>
                  <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1 text-cyan-100">
                    Split lines
                  </span>
                </div>
              )}
            </div>

            <div className="flex min-h-[420px] items-start justify-center p-3 sm:min-h-[560px] sm:p-5 lg:min-h-[520px]">
              {sourceImageUrl ? (
                <div
                  ref={previewFrameRef}
                  className={`relative inline-block max-w-full touch-none select-none ${
                    activeDrag ? "cursor-grabbing" : ""
                  }`}
                  onPointerMove={(event) => {
                    if (activeDrag) applyDrag(activeDrag, event.clientX, event.clientY);
                  }}
                  onPointerUp={stopDrag}
                  onPointerCancel={stopDrag}
                >
                  <img
                    src={sourceImageUrl}
                    alt="Uploaded storyboard preview"
                    draggable={false}
                    className="block max-h-[58vh] w-auto max-w-full rounded-lg border border-white/10 bg-black object-contain shadow-[0_20px_50px_rgba(0,0,0,0.45)] sm:max-h-[70vh] lg:max-h-[calc(100vh-210px)]"
                  />

                  {canAdjustCrop && (
                    <div className="absolute inset-0">
                      <div
                        className="absolute left-0 right-0 top-0 bg-black/55"
                        style={{ height: `${(trimTop / sourceHeight) * 100}%` }}
                      />
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-black/55"
                        style={{ height: `${(trimBottom / sourceHeight) * 100}%` }}
                      />
                      <div
                        className="absolute left-0 bg-black/55"
                        style={{
                          top: `${(trimTop / sourceHeight) * 100}%`,
                          width: `${(trimLeft / sourceWidth) * 100}%`,
                          height: `${(Math.max(0, cropHeight) / sourceHeight) * 100}%`,
                        }}
                      />
                      <div
                        className="absolute right-0 bg-black/55"
                        style={{
                          top: `${(trimTop / sourceHeight) * 100}%`,
                          width: `${(trimRight / sourceWidth) * 100}%`,
                          height: `${(Math.max(0, cropHeight) / sourceHeight) * 100}%`,
                        }}
                      />

                      <div
                        className="pointer-events-none absolute rounded-md border-2 border-[#f5d67b] shadow-[0_0_0_1px_rgba(0,0,0,0.55),0_0_22px_rgba(245,214,123,0.28)]"
                        style={{
                          left: `${(trimLeft / sourceWidth) * 100}%`,
                          top: `${(trimTop / sourceHeight) * 100}%`,
                          width: `${(Math.max(0, cropWidth) / sourceWidth) * 100}%`,
                          height: `${(Math.max(0, cropHeight) / sourceHeight) * 100}%`,
                        }}
                      />

                      {[
                        { key: "left", label: "Left trim", target: { kind: "trim-left" } as DragTarget, left: (trimLeft / sourceWidth) * 100, top: (trimTop / sourceHeight) * 100, height: (Math.max(0, cropHeight) / sourceHeight) * 100, cursor: "cursor-ew-resize" },
                        { key: "right", label: "Right trim", target: { kind: "trim-right" } as DragTarget, left: ((sourceWidth - trimRight) / sourceWidth) * 100, top: (trimTop / sourceHeight) * 100, height: (Math.max(0, cropHeight) / sourceHeight) * 100, cursor: "cursor-ew-resize" },
                      ].map((bar) => (
                        <button
                          key={bar.key}
                          type="button"
                          aria-label={bar.label}
                          title={bar.label}
                          className={`absolute z-20 w-7 -translate-x-1/2 ${bar.cursor}`}
                          style={{ left: `${bar.left}%`, top: `${bar.top}%`, height: `${bar.height}%` }}
                          onPointerDown={(event) => startDrag(event, bar.target)}
                        >
                          <span className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 rounded-full bg-[#f5d67b] shadow-[0_0_0_1px_rgba(0,0,0,0.55),0_0_14px_rgba(245,214,123,0.7)]" />
                          <span className="absolute left-1/2 top-1/2 h-9 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/50 bg-[#f5d67b]" />
                        </button>
                      ))}

                      {[
                        { key: "top", label: "Top trim", target: { kind: "trim-top" } as DragTarget, left: (trimLeft / sourceWidth) * 100, top: (trimTop / sourceHeight) * 100, width: (Math.max(0, cropWidth) / sourceWidth) * 100, cursor: "cursor-ns-resize" },
                        { key: "bottom", label: "Bottom trim", target: { kind: "trim-bottom" } as DragTarget, left: (trimLeft / sourceWidth) * 100, top: ((sourceHeight - trimBottom) / sourceHeight) * 100, width: (Math.max(0, cropWidth) / sourceWidth) * 100, cursor: "cursor-ns-resize" },
                      ].map((bar) => (
                        <button
                          key={bar.key}
                          type="button"
                          aria-label={bar.label}
                          title={bar.label}
                          className={`absolute z-20 h-7 -translate-y-1/2 ${bar.cursor}`}
                          style={{ left: `${bar.left}%`, top: `${bar.top}%`, width: `${bar.width}%` }}
                          onPointerDown={(event) => startDrag(event, bar.target)}
                        >
                          <span className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-[#f5d67b] shadow-[0_0_0_1px_rgba(0,0,0,0.55),0_0_14px_rgba(245,214,123,0.7)]" />
                          <span className="absolute left-1/2 top-1/2 h-3 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/50 bg-[#f5d67b]" />
                        </button>
                      ))}

                      {previewVerticalGuides.map((guide, idx) => (
                        <button
                          key={`v-${idx}`}
                          type="button"
                          aria-label={`Vertical split line ${idx + 1}`}
                          title={`Vertical split line ${idx + 1}`}
                          className="absolute z-30 w-7 -translate-x-1/2 cursor-ew-resize"
                          style={{
                            left: `${((trimLeft + guide) / sourceWidth) * 100}%`,
                            top: `${(trimTop / sourceHeight) * 100}%`,
                            height: `${(Math.max(0, cropHeight) / sourceHeight) * 100}%`,
                          }}
                          onPointerDown={(event) => startDrag(event, { kind: "vertical-guide", index: idx })}
                        >
                          <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-cyan-200 shadow-[0_0_0_1px_rgba(0,0,0,0.7),0_0_12px_rgba(103,232,249,0.8)]" />
                          <span className="absolute left-1/2 top-1/2 h-8 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/50 bg-cyan-200" />
                        </button>
                      ))}

                      {previewHorizontalGuides.map((guide, idx) => (
                        <button
                          key={`h-${idx}`}
                          type="button"
                          aria-label={`Horizontal split line ${idx + 1}`}
                          title={`Horizontal split line ${idx + 1}`}
                          className="absolute z-30 h-7 -translate-y-1/2 cursor-ns-resize"
                          style={{
                            left: `${(trimLeft / sourceWidth) * 100}%`,
                            top: `${((trimTop + guide) / sourceHeight) * 100}%`,
                            width: `${(Math.max(0, cropWidth) / sourceWidth) * 100}%`,
                          }}
                          onPointerDown={(event) => startDrag(event, { kind: "horizontal-guide", index: idx })}
                        >
                          <span className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-cyan-200 shadow-[0_0_0_1px_rgba(0,0,0,0.7),0_0_12px_rgba(103,232,249,0.8)]" />
                          <span className="absolute left-1/2 top-1/2 h-3 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/50 bg-cyan-200" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <label
                  htmlFor="storyboard-upload-empty"
                  className="flex min-h-[360px] w-full max-w-3xl cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/25 bg-white/[0.02] p-5 transition hover:border-[#f5d67b]/60 hover:bg-white/[0.05]"
                >
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-[#f5d67b]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Click to upload image</div>
                      <div className="text-xs text-white/50">PNG, JPG, WEBP supported</div>
                    </div>
                    <Input
                      id="storyboard-upload-empty"
                      type="file"
                      accept="image/*"
                      onChange={onFileChange}
                      className="max-w-sm"
                    />
                  </div>
                </label>
              )}
            </div>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
            <Card>
              <CardHeader className="px-5 py-4">
                <CardTitle className="text-base">Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-5 py-4">
                <div>
                  <Label className="text-sm text-white/70">Upload storyboard image</Label>
                  <Input
                    id="storyboard-upload-panel"
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="rows">Rows</Label>
                    <Input
                      id="rows"
                      type="number"
                      min={1}
                      max={MAX_GRID_SIZE}
                      value={rows}
                      onChange={(event) => setRows(Number(event.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cols">Columns</Label>
                    <Input
                      id="cols"
                      type="number"
                      min={1}
                      max={MAX_GRID_SIZE}
                      value={cols}
                      onChange={(event) => setCols(Number(event.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="base-name">Output base name</Label>
                  <Input
                    id="base-name"
                    value={fileName}
                    onChange={(event) => setFileName(event.target.value)}
                    placeholder="storyboard"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/55">
                  <div>
                    <div className="uppercase tracking-[0.15em] text-white/35">Output</div>
                    <div className="mt-1 text-white">{expectedCount} images</div>
                  </div>
                  <div>
                    <div className="uppercase tracking-[0.15em] text-white/35">Crop</div>
                    <div className="mt-1 text-white">{Math.max(0, cropWidth)} x {Math.max(0, cropHeight)}</div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button onClick={splitStoryboard} disabled={isProcessing || !sourceImageUrl} className="w-full">
                    {isProcessing ? "Splitting..." : `Split into ${expectedCount} images`}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    disabled={!sourceImageUrl}
                    onClick={() => {
                      setTrimLeft(0);
                      setTrimRight(0);
                      setTrimTop(0);
                      setTrimBottom(0);
                      setVerticalGuides(buildEvenGuides(cols, sourceWidth));
                      setHorizontalGuides(buildEvenGuides(rows, sourceHeight));
                    }}
                  >
                    Reset Guides
                  </Button>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Split Panels ({slices.length})</CardTitle>
              <Button onClick={downloadAll} disabled={slices.length === 0}>
                Download All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {slices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/20 px-4 py-10 text-center text-sm text-white/40">
                No split panels yet. Upload an image and click split.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {slices.map((slice) => (
                  <div key={slice.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-3">
                    <img
                      src={slice.previewUrl}
                      alt={`Panel row ${slice.row} column ${slice.col}`}
                      className="w-full rounded-lg border border-white/10"
                    />
                    <div className="text-xs text-white/60">
                      Row {slice.row}, Col {slice.col}
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => downloadBlob(slice.blob, slice.filename)}
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
