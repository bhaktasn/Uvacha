"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@/components/ui";

type Slice = {
  id: string;
  filename: string;
  previewUrl: string;
  blob: Blob;
  row: number;
  col: number;
};

const MAX_GRID_SIZE = 20;

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

  const expectedCount = useMemo(() => rows * cols, [rows, cols]);

  useEffect(() => {
    return () => {
      if (sourceImageUrl) {
        URL.revokeObjectURL(sourceImageUrl);
      }
    };
  }, [sourceImageUrl]);

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

      clearPreviousSlices();

      const generated: Slice[] = [];

      for (let row = 0; row < rows; row += 1) {
        const yStart = Math.round((row * imgHeight) / rows);
        const yEnd = Math.round(((row + 1) * imgHeight) / rows);
        const panelHeight = yEnd - yStart;

        for (let col = 0; col < cols; col += 1) {
          const xStart = Math.round((col * imgWidth) / cols);
          const xEnd = Math.round(((col + 1) * imgWidth) / cols);
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

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
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
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white">
              Split storyboard sheets into panel images
            </h1>
            <p className="mt-2 text-white/60 max-w-2xl">
              Upload one storyboard image, set the grid size, and download each panel as a separate PNG.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="storyboard-upload">Storyboard image</Label>
                <Input id="storyboard-upload" type="file" accept="image/*" onChange={onFileChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={splitStoryboard} disabled={isProcessing || !sourceImageUrl}>
                  {isProcessing ? "Splitting..." : `Split into ${expectedCount} images`}
                </Button>
                <span className="text-sm text-white/50">
                  Example: 3x2 grid creates 6 images.
                </span>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Source Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {sourceImageUrl ? (
                <img
                  src={sourceImageUrl}
                  alt="Uploaded storyboard preview"
                  className="w-full rounded-xl border border-white/10"
                />
              ) : (
                <div className="rounded-xl border border-dashed border-white/20 px-4 py-10 text-center text-sm text-white/40">
                  Upload a storyboard image to preview it here.
                </div>
              )}
            </CardContent>
          </Card>
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
