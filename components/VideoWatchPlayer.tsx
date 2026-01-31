'use client';

import MuxPlayer from "@mux/mux-player-react";

interface VideoWatchPlayerProps {
  playbackId: string;
  poster?: string | null;
}

export function VideoWatchPlayer({ playbackId, poster }: VideoWatchPlayerProps) {
  return (
    <MuxPlayer
      className="aspect-video w-full overflow-hidden rounded-2xl border border-white/5 bg-black"
      playbackId={playbackId}
      poster={poster ?? undefined}
      streamType="on-demand"
      preload="metadata"
      preferPlayback="mse"
      autoPlay="muted"
      accentColor="#f5d67b"
    />
  );
}

