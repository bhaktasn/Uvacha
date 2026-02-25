import Link from "next/link";
import { notFound } from "next/navigation";

import { TipCreatorButton } from "@/components/TipCreatorButton";
import { UserAvatar } from "@/components/UserAvatar";
import { VideoComments } from "@/components/VideoComments";
import { VideoPromptDropdown } from "@/components/VideoPromptDropdown";
import { VideoRatingPanel } from "@/components/VideoRatingPanel";
import { VideoViewCount } from "@/components/VideoViewCount";
import { VideoWatchPlayer } from "@/components/VideoWatchPlayer";
import { getMuxThumbnailUrl } from "@/lib/mux/thumbnails";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getViewerId } from "@/lib/supabase/viewer";
import { isValidUSDCAddress } from "@/lib/utils/wallet-validation";
import { getVideoRatingSummary, getViewerVideoRating } from "@/lib/video-ratings";
import type { Database } from "@/lib/types/database";

type VideoRow = Database["public"]["Tables"]["videos"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type VideoWithProfile = VideoRow & {
  profiles: Pick<ProfileRow, "username" | "usdc_wallet_address" | "avatar_url"> | null;
};
type RawVideoWithProfile = Omit<VideoWithProfile, "profiles"> & {
  profiles: VideoWithProfile["profiles"] | VideoWithProfile["profiles"][] | null;
};

interface VideoPageProps {
  params: Promise<{
    id: string;
  }>;
}

const dateWithTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const formatCreatorHandle = (username?: string | null) =>
  username ? `@${username}` : "Unknown creator";

async function fetchVideo(videoId: string): Promise<VideoWithProfile | null> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("videos")
      .select(
        "id,profile_id,title,description,prompt,generation_source,mux_asset_id,mux_playback_id,view_count,unlock_at,created_at,profiles:profiles!videos_profile_id_fkey(username,usdc_wallet_address,avatar_url)"
      )
      .eq("id", videoId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch video", error);
      return null;
    }

    if (!data) {
      return null;
    }

    const raw = data as RawVideoWithProfile;
    const normalizedProfile = Array.isArray(raw.profiles)
      ? raw.profiles[0] ?? null
      : raw.profiles ?? null;

    return {
      ...raw,
      profiles: normalizedProfile,
    };
  } catch (error) {
    console.error("Unable to initialize Supabase client", error);
    return null;
  }
}

export default async function VideoDetailPage({ params }: VideoPageProps) {
  const { id } = await params;
  const viewerId = await getViewerId();
  const video = await fetchVideo(id);

  if (!video) {
    notFound();
  }

  const [ratingSummary, viewerRating] = await Promise.all([
    getVideoRatingSummary(video.id),
    getViewerVideoRating(video.id, viewerId),
  ]);

  const competitionDate = new Date(video.unlock_at);
  const now = new Date();
  const isUnlocked = competitionDate <= now;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const isCompetingToday = competitionDate >= todayStart && competitionDate < tomorrowStart;
  const hasCompeted = isUnlocked && !isCompetingToday;
  const canView = isUnlocked || viewerId === video.profile_id;
  const playbackId = video.mux_playback_id ?? null;
  
  // Check if creator has a valid USDC address for tipping
  const creatorWalletAddress = video.profiles?.usdc_wallet_address ?? null;
  const canTip = creatorWalletAddress && isValidUSDCAddress(creatorWalletAddress);
  const thumbnailUrl = getMuxThumbnailUrl(video.mux_playback_id, {
    width: 1280,
    height: 720,
    time: 2,
  });

  return (
    <div className="relative isolate min-h-[calc(100vh-5rem)] px-6 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-6 top-24 h-72 w-72 rounded-full bg-[#f5d67b]/15 blur-[170px]" />
        <div className="absolute bottom-[-4rem] left-5 h-80 w-80 rounded-full bg-[#f0b90b]/10 blur-[190px]" />
      </div>

      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:border-[#f5d67b]/60 hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/videos"
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:border-[#f5d67b]/60 hover:text-white"
          >
            Creator console
          </Link>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex-1 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-black/60 p-3 shadow-[0_40px_160px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
              {playbackId ? (
                canView ? (
                  <VideoWatchPlayer playbackId={playbackId} poster={thumbnailUrl} />
                ) : (
                  <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center">
                    <p className="text-lg font-semibold text-white/80">This video is competing on{" "}
                      {dateWithTimeFormatter.format(new Date(video.unlock_at))}</p>
                    <p className="text-sm text-white/50">It will be viewable when the competition day begins.</p>
                  </div>
                )
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-white/60">
                  This video is still processing. Check back shortly.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/50 p-6 shadow-[0_35px_140px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.35em] text-[#f5d67b]">
                  {formatCreatorHandle(video.profiles?.username)}
                </p>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <h1 className="text-3xl font-semibold text-white lg:text-4xl">{video.title}</h1>
                  <VideoRatingPanel
                    videoId={video.id}
                    initialAverage={ratingSummary.average}
                    initialCount={ratingSummary.count}
                    initialViewerRating={viewerRating}
                    canRate={Boolean(viewerId)}
                    className="flex-shrink-0 lg:ml-6"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-white/10 px-4 py-1 text-white/60">
                  {video.generation_source === "ai" ? "AI generated" : "Human made"}
                </span>
                <span className={`rounded-full border px-4 py-1 font-semibold ${
                  hasCompeted
                    ? "border-white/15 bg-white/5 text-white/60"
                    : isCompetingToday
                      ? "border-[#f5d67b]/40 bg-[#f5d67b]/10 text-[#f5d67b]"
                      : "border-[#f5d67b]/20 bg-[#f5d67b]/5 text-[#f5d67b]/80"
                }`}>
                  {hasCompeted
                    ? `Competed ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(competitionDate)}`
                    : isCompetingToday
                      ? `Competing today`
                      : `Enters competition ${new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(competitionDate)}`}
                </span>
              </div>

              <VideoPromptDropdown prompt={video.prompt} />

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/70">
                <VideoViewCount videoId={video.id} initialCount={video.view_count ?? 0} />
                <span className="text-white/35">•</span>
                <span>
                  Published {dateWithTimeFormatter.format(new Date(video.created_at))}
                </span>
              </div>

              <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-white/75">
                {video.description}
              </p>
            </div>
            <VideoComments videoId={video.id} viewerId={viewerId} />
          </div>

          <aside className="w-full max-w-sm space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_25px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Creator</p>
              <Link 
                href={video.profiles?.username ? `/u/${video.profiles.username}` : '#'}
                className="mt-3 flex items-center gap-4 group"
              >
                <UserAvatar
                  avatarUrl={video.profiles?.avatar_url}
                  username={video.profiles?.username}
                  size="lg"
                />
                <div>
                  <p className="text-xl font-semibold text-white group-hover:text-[#f5d67b] transition">
                    {formatCreatorHandle(video.profiles?.username)}
                  </p>
                  <p className="text-sm text-white/50">View profile →</p>
                </div>
              </Link>
              <p className="mt-4 text-sm text-white/65">
                Rate this entry and share feedback. Your vote helps separate art from slop.
              </p>
              {canTip && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <TipCreatorButton 
                    creatorAddress={creatorWalletAddress} 
                    creatorUsername={video.profiles?.username}
                  />
                </div>
              )}
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_25px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Competition day</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(video.unlock_at))}
              </p>
              <p className="mt-1 text-sm text-white/65">
                Submitted {dateWithTimeFormatter.format(new Date(video.created_at))}
              </p>
              {hasCompeted ? (
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                  Competition ended
                </p>
              ) : isCompetingToday ? (
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#f5d67b]">
                  Competing now
                </p>
              ) : (
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#f5d67b]/70">
                  Upcoming competition
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

