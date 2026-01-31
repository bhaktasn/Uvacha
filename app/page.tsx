import Link from "next/link";

import { VideoCard } from "@/components/VideoCard";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";

type VideoRow = Database["public"]["Tables"]["videos"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type VideoPreview = Pick<
  VideoRow,
  "id" | "title" | "created_at" | "generation_source" | "mux_playback_id"
> & {
  profiles: Pick<ProfileRow, "username" | "avatar_url"> | null;
};
type RawVideoPreview = Omit<VideoPreview, "profiles"> & {
  profiles: VideoPreview["profiles"] | VideoPreview["profiles"][] | null;
};

export const revalidate = 60;

const pillars = [
  {
    title: "Daily Battles",
    description:
      "Every 24 hours, a new arena. Submit your best AI-generated video and let the community decide if it's art or slop.",
    icon: "⚔️",
  },
  {
    title: "Community Curators",
    description:
      "No algorithms, no gatekeepers. Real humans rate every video on a 0-5 scale—💩 slop to 🤌 certified art.",
    icon: "👁️",
  },
  {
    title: "USDC Rewards",
    description:
      "Top-rated videos of the day split the daily prize pool. Create art, get paid. Simple as that.",
    icon: "💰",
  },
  {
    title: "Prompt Sharing",
    description:
      "Learn from the best. Creators share their prompts, techniques, and workflows. Tip them if their secrets helped you level up.",
    icon: "🔓",
  },
] as const;

const stats = [
  { label: "Daily prize", value: "USDC" },
  { label: "Rating scale", value: "0→5" },
  { label: "Competition", value: "24h" },
] as const;

const manifesto = [
  "2026 is the year of the Slopacolypse.",
  "AI video tools flood every platform with noise.",
  "Uvacha is the antidote—a daily arena where art rises and slop gets labeled.",
  "Join the resistance. Create something worth watching.",
] as const;

async function fetchLatestVideos(): Promise<VideoPreview[]> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("videos")
      .select(
        "id,title,created_at,generation_source,mux_playback_id,profiles:profiles!videos_profile_id_fkey(username,avatar_url)"
      )
      .lte("unlock_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Failed to load videos for home grid", error);
      return [];
    }

    const rawData = (data ?? []) as RawVideoPreview[];
    return rawData.map((video) => ({
      ...video,
      profiles: Array.isArray(video.profiles)
        ? video.profiles[0] ?? null
        : video.profiles ?? null,
    }));
  } catch (error) {
    console.error("Failed to initialize Supabase client", error);
    return [];
  }
}

export default async function Home() {
  const latestVideos = await fetchLatestVideos();
  const hasVideos = latestVideos.length > 0;

  return (
    <div className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute inset-x-0 top-10 mx-auto h-72 w-[80%] rounded-[50%] bg-[#f5d67b]/5 blur-[200px]" />
      </div>

      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12">
        <div className="rounded-[2.5rem] border border-white/10 bg-black/20 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-12">
          {hasVideos ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  id={video.id}
                  title={video.title}
                  createdAt={video.created_at}
                  generationSource={video.generation_source}
                  muxPlaybackId={video.mux_playback_id}
                  creatorUsername={video.profiles?.username ?? null}
                  creatorAvatarUrl={video.profiles?.avatar_url}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center text-white/50">
              No videos yet. Once creators start uploading, the newest 20 drops
              will line up here.
            </div>
          )}
        </div>
      </section>

      {/* The Manifesto Section */}
      <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-red-900/20 via-orange-900/10 to-transparent blur-[100px]" />
        </div>

        <div className="relative overflow-hidden rounded-[3rem] border border-white/5 bg-gradient-to-br from-black/80 via-black/60 to-red-950/20 p-1">
          <div className="rounded-[2.75rem] bg-gradient-to-br from-[#0a0a0a] to-[#0f0808] p-8 sm:p-12 lg:p-16">
            <div className="mb-12 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
              <span className="font-mono text-xs uppercase tracking-[0.5em] text-red-400/80">
                ⚠️ The Slopacolypse is here
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
            </div>

            <div className="mx-auto max-w-3xl space-y-8 text-center">
              <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                  AI video is flooding every platform.
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#f5d67b] to-[#ff9d4d] bg-clip-text text-transparent">
                  Most of it is slop.
                </span>
              </h2>

              <p className="text-lg leading-relaxed text-white/60 sm:text-xl">
                Andrej Karpathy called it—2026 is the year of the Slopacolypse. Every scroll is 
                drowning in AI-generated noise. But buried in the flood? Real art. Real vision. 
                Real creativity waiting to be discovered.
              </p>

              <div className="inline-flex items-center gap-2 rounded-full border border-[#f5d67b]/30 bg-[#f5d67b]/10 px-6 py-2">
                <span className="text-2xl">🤌</span>
                <span className="font-semibold text-[#f5d67b]">Uvacha separates art from slop.</span>
              </div>
            </div>

            <div className="mt-16 grid gap-6 text-left sm:grid-cols-2">
              {manifesto.map((line, index) => (
                <div
                  key={line}
                  className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition hover:border-[#f5d67b]/20 hover:bg-white/[0.04]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f5d67b]/20 to-[#f5d67b]/5 font-mono text-sm font-bold text-[#f5d67b]">
                    {index + 1}
                  </span>
                  <p className="text-white/80 group-hover:text-white">{line}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="text-center space-y-4 mb-12">
          <p className="text-xs uppercase tracking-[0.5em] text-[#f5d67b]">How the arena works</p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Daily competition. Community curation. Real rewards.
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-6 transition hover:border-[#f5d67b]/30"
            >
              <div className="absolute -right-4 -top-4 text-6xl opacity-10 transition group-hover:opacity-20">
                {pillar.icon}
              </div>
              <div className="relative">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5d67b]/10 text-2xl">
                  {pillar.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{pillar.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{pillar.description}</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#f5d67b]/50 to-transparent opacity-0 transition group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </section>

      {/* Stats + CTA Section */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="overflow-hidden rounded-[3rem] border border-white/10 bg-gradient-to-br from-[#f5d67b]/5 via-black/40 to-black/60 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-12 p-8 text-center sm:p-12 lg:flex-row lg:text-left">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <span className="text-xl">💩</span>
                <span className="text-sm text-white/60">→</span>
                <span className="text-xl">🤌</span>
                <span className="ml-2 text-sm font-medium text-white/80">The journey from slop to art</span>
              </div>

              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                Ready to prove AI can make real art?
              </h2>

              <p className="text-white/60">
                Enter the daily arena. Share your process. Learn from others. 
                Get rewarded when the community recognizes your work as art, not slop.
              </p>

              <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full border border-[#f5d67b] bg-[#f5d67b] px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-black shadow-[0_20px_45px_rgba(245,214,123,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ffe8a0]"
                >
                  Enter the Arena
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/80 transition hover:border-[#f5d67b]/60 hover:text-white"
                >
                  Learn More
                </Link>
              </div>
            </div>

            <div className="flex gap-4 lg:gap-6">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center rounded-2xl border border-white/10 bg-black/40 px-6 py-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
                >
                  <p className="text-2xl font-bold text-[#f5d67b] sm:text-3xl">{stat.value}</p>
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/50">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
