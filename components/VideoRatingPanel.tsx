'use client';

import Link from "next/link";
import { useMemo, useState } from "react";

interface VideoRatingPanelProps {
  videoId: string;
  initialAverage: number | null;
  initialCount: number;
  initialViewerRating: number | null;
  canRate: boolean;
  className?: string;
}

const STAR_VALUES = [1, 2, 3, 4, 5] as const;
const STAR_ICON_SIZE = 26;
const STAR_GAP_CLASS = "gap-[6px]";

const ratingMoods: Record<
  number,
  { label: string; emoji: string; accent: string; animation?: string }
> = {
  1: { label: "Slop", emoji: "💩", accent: "text-rose-200", animation: "animate-bounce" },
  5: { label: "Art", emoji: "🤌", accent: "text-[#f5d67b]", animation: "animate-pulse" },
};

export function VideoRatingPanel({
  videoId,
  initialAverage,
  initialCount,
  initialViewerRating,
  canRate,
  className = "",
}: VideoRatingPanelProps) {
  const [ratingCount, setRatingCount] = useState(initialCount);
  const [averageRating, setAverageRating] = useState<number | null>(
    initialAverage ?? null
  );
  const [viewerRating, setViewerRating] = useState<number | null>(
    initialViewerRating ?? null
  );
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeRating = hoverRating ?? viewerRating ?? null;
  const showMood = activeRating === 1 || activeRating === 5;
  const mood =
    showMood && activeRating ? ratingMoods[activeRating] ?? null : null;

  const averageDisplay = useMemo(() => {
    if (!averageRating || Number.isNaN(averageRating)) {
      return { text: "—", precise: null };
    }
    const precise = Math.round(averageRating * 10) / 10;
    return { text: precise.toFixed(1), precise };
  }, [averageRating]);

  async function handleRate(value: number) {
    if (!canRate || pending) {
      return;
    }

    setPending(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/videos/${videoId}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating: value }),
      });

      if (response.status === 401) {
        setErrorMessage("Log in to rate this drop.");
        setPending(false);
        return;
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Unable to save your rating right now.");
      }

      const payload = (await response.json()) as {
        average: number | null;
        count: number;
        viewerRating: number | null;
      };

      setAverageRating(payload.average ?? null);
      setRatingCount(payload.count ?? 0);
      setViewerRating(payload.viewerRating ?? value);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={`flex flex-col gap-2 text-white ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative inline-flex items-center">
          <div className="pointer-events-none opacity-60">
            <AverageStarRow average={averageRating} />
          </div>
          {mood && activeRating && (
            <div
              className={`pointer-events-none absolute -top-11 flex flex-col items-center gap-1 text-xs font-semibold text-white/80 ${
                activeRating === 1 ? "left-0 -translate-x-2" : "right-0 translate-x-2"
              }`}
            >
              <span className={`${mood.animation} text-base ${mood.accent}`}>
                {mood.emoji}
              </span>
              <span
                className={`text-[0.7rem] font-semibold uppercase tracking-[0.3em] ${mood.accent}`}
              >
                {mood.label}
              </span>
            </div>
          )}
          <div
            className={`absolute inset-0 flex items-center ${STAR_GAP_CLASS} ${
              canRate ? "" : "pointer-events-none opacity-50"
            }`}
          >
            {STAR_VALUES.map((value) => {
              const isHoverActive = hoverRating !== null && value <= hoverRating;
              const isActive =
                hoverRating === null &&
                viewerRating !== null &&
                value <= viewerRating;

              return (
                <button
                  key={value}
                  type="button"
                  aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
                  style={{
                    width: STAR_ICON_SIZE,
                    height: STAR_ICON_SIZE,
                  }}
                  className={`relative z-10 flex items-center justify-center rounded-full transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5d67b] ${
                    pending ? "cursor-wait" : "hover:scale-110 focus-visible:scale-110"
                  }`}
                  onClick={() => handleRate(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(null)}
                  disabled={pending}
                >
                  <StarIcon
                    className={
                      isHoverActive
                        ? "text-[#ffe9a9]"
                        : isActive
                        ? "text-[#f5d67b]"
                        : "text-white/30"
                    }
                    size={STAR_ICON_SIZE}
                  />
                </button>
              );
            })}
          </div>
        </div>
        <span className="text-sm text-white/60">({ratingCount})</span>
        {!mood && !canRate && (
          <Link
            href="/login"
            className="text-xs font-semibold uppercase tracking-[0.3em] text-[#f5d67b] hover:text-[#f5d67b]/80"
          >
            Log in to rate
          </Link>
        )}
      </div>

      {errorMessage && (
        <p className="text-sm text-red-300" role="alert">
          {errorMessage}
        </p>
      )}

      {!canRate && !viewerRating && (
        <p className="text-xs text-white/50">
          Create an account or log in to leave a rating.
        </p>
      )}
    </div>
  );
}

function AverageStarRow({ average }: { average: number | null }) {
  return (
    <div className={`flex items-center ${STAR_GAP_CLASS}`} aria-hidden="true">
      {STAR_VALUES.map((value) => {
        const fillLevel = average
          ? Math.min(Math.max(average - (value - 1), 0), 1)
          : 0;
        return <PartialStar key={value} fill={fillLevel} />;
      })}
    </div>
  );
}

function PartialStar({ fill }: { fill: number }) {
  return (
    <span
      className="relative inline-flex shrink-0"
      style={{ width: STAR_ICON_SIZE, height: STAR_ICON_SIZE }}
    >
      <StarIcon className="absolute inset-0 text-white/15" size={STAR_ICON_SIZE} />
      <span
        className="absolute inset-0 overflow-hidden text-[#f5d67b]/60"
        style={{ width: `${fill * 100}%` }}
      >
        <StarIcon className="text-[#f5d67b]/60" size={STAR_ICON_SIZE} />
      </span>
    </span>
  );
}

function StarIcon({ className, size = STAR_ICON_SIZE }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}


