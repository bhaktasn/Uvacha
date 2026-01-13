'use client';

import { useEffect, useMemo, useRef, useState } from "react";

interface VideoViewCountProps {
  videoId: string;
  initialCount?: number | null;
  className?: string;
}

const compactFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

const standardFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const formatViewCount = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }

  if (value < 1000) {
    return standardFormatter.format(value);
  }

  return compactFormatter.format(value);
};

export function VideoViewCount({ videoId, initialCount = 0, className = "" }: VideoViewCountProps) {
  const [views, setViews] = useState(Math.max(0, initialCount ?? 0));
  const recordedVideoRef = useRef<string | null>(null);

  useEffect(() => {
    if (!videoId) {
      return;
    }

    if (recordedVideoRef.current === videoId) {
      return;
    }

    recordedVideoRef.current = videoId;

    let cancelled = false;

    const recordView = async () => {
      try {
        const response = await fetch(`/api/videos/${videoId}/views`, {
          method: "POST",
          keepalive: true,
        });

        if (!response.ok) {
          console.error("Failed to record view", { status: response.status });
          return;
        }

        const payload = (await response.json()) as { viewCount?: number | null };

        if (!cancelled && typeof payload.viewCount === "number") {
          setViews(Math.max(0, payload.viewCount));
        }
      } catch (error) {
        console.error("Failed to submit view", error);
      }
    };

    recordView();

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  const formattedViews = useMemo(() => formatViewCount(views), [views]);
  const wrapperClassName = ["inline-flex items-center gap-1.5 text-sm text-white/70", className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={wrapperClassName} aria-live="polite" aria-label={`${views} views`}>
      <EyeIcon />
      <span className="font-semibold text-white">{formattedViews}</span>
      <span className="text-white/55">views</span>
    </span>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 text-white/45"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.5 12s3.5-7 10.5-7 10.5 7 10.5 7-3.5 7-10.5 7-10.5-7-10.5-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}


