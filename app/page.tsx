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
      "Every 24 hours, a new arena opens. Submit your best AI-generated video and let the community decide if it's art or slop.",
    icon: "⚔️",
  },
  {
    title: "Community Curators",
    description:
      "No algorithms, no gatekeepers. Real humans rate every video from 💩 slopto 🤌 certified art.",
    icon: "👁️",
  },
  {
    title: "USDC Rewards",
    description:
      "Top-rated videos of the day split the prize pool. Make something people love, get paid. That's the deal.",
    icon: "💰",
  },
  {
    title: "Prompt Sharing",
    description:
      "Learn from the best. Creators share their prompts, techniques, and workflows. Tip them when their insights help you level up.",
    icon: "🔓",
  },
] as const;

const stats = [
  { label: "Daily prize", value: "USDC" },
  { label: "Rating scale", value: "0→5" },
  { label: "Competition", value: "24h" },
] as const;

const manifesto = [
  "AI video just got incredibly powerful.",
  "Anyone can create—but who's making something truly worth watching?",
  "Uvacha is the stage where real artistry gets discovered and celebrated.",
  "Show us what you've got. The community is waiting.",
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

      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <div className="relative grid gap-6 lg:grid-cols-[1fr,1fr] lg:items-center">
            <div className="space-y-3">
              <h1 className="text-xl font-semibold leading-snug text-white sm:text-2xl lg:text-3xl">
                <span className="bg-gradient-to-r from-[#f5d67b] to-[#e8b84a] bg-clip-text text-transparent">Uvacha</span>, the daily video competition to separate{" "}
                <span className="bg-gradient-to-r from-[#f5d67b] to-[#e8b84a] bg-clip-text text-transparent">art</span>{" "}
                from slop.
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-white/55">
                Every 24 hours, creators submit. The community filters. The best rises.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <svg viewBox="0 0 300 200" fill="none" className="w-full max-w-[300px]" aria-hidden="true">
                {/* Round 1 connectors */}
                <line x1="75" y1="27" x2="110" y2="27" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <line x1="110" y1="27" x2="110" y2="67" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <line x1="75" y1="67" x2="110" y2="67" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <line x1="110" y1="47" x2="140" y2="47" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <line x1="75" y1="117" x2="110" y2="117" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <line x1="110" y1="117" x2="110" y2="157" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <line x1="75" y1="157" x2="110" y2="157" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <line x1="110" y1="137" x2="140" y2="137" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                {/* Round 2 connectors */}
                <line x1="190" y1="47" x2="215" y2="47" stroke="rgba(245,214,123,0.25)" strokeWidth="1" />
                <line x1="215" y1="47" x2="215" y2="137" stroke="rgba(245,214,123,0.25)" strokeWidth="1" />
                <line x1="190" y1="137" x2="215" y2="137" stroke="rgba(245,214,123,0.25)" strokeWidth="1" />
                <line x1="215" y1="92" x2="235" y2="92" stroke="rgba(245,214,123,0.4)" strokeWidth="1.2" />
                {/* Round 1 videos */}
                <rect x="20" y="14" width="55" height="28" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <polygon points="40,22 40,36 50,29" fill="rgba(255,255,255,0.12)" />
                <rect x="20" y="54" width="55" height="28" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <polygon points="40,62 40,76 50,69" fill="rgba(255,255,255,0.12)" />
                <rect x="20" y="104" width="55" height="28" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <polygon points="40,112 40,126 50,119" fill="rgba(255,255,255,0.12)" />
                <rect x="20" y="144" width="55" height="28" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <polygon points="40,152 40,166 50,159" fill="rgba(255,255,255,0.12)" />
                {/* Round 2 videos */}
                <rect x="140" y="34" width="50" height="26" rx="4" fill="rgba(245,214,123,0.06)" stroke="rgba(245,214,123,0.2)" strokeWidth="1" />
                <polygon points="158,41 158,53 168,47" fill="rgba(245,214,123,0.25)" />
                <rect x="140" y="124" width="50" height="26" rx="4" fill="rgba(245,214,123,0.06)" stroke="rgba(245,214,123,0.2)" strokeWidth="1" />
                <polygon points="158,131 158,143 168,137" fill="rgba(245,214,123,0.25)" />
                {/* Winner */}
                <circle cx="268" cy="92" r="28" fill="rgba(245,214,123,0.06)" />
                <rect x="240" y="78" width="56" height="30" rx="6" fill="rgba(245,214,123,0.1)" stroke="#f5d67b" strokeWidth="1.5" />
                <polygon points="260,86 260,100 274,93" fill="rgba(245,214,123,0.65)" />
                <path d="M255 72 L260 65 L268 72 L276 65 L281 72" stroke="#f5d67b" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
              </svg>
            </div>
          </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
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

      {/* The Manifesto Section — with Funnel graphic */}
      <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-900/20 via-orange-900/10 to-transparent blur-[100px]" />
        </div>

        <div className="relative overflow-hidden rounded-[3rem] border border-white/5 bg-gradient-to-br from-black/80 via-black/60 to-amber-950/20 p-1">
          <div className="rounded-[2.75rem] bg-gradient-to-br from-[#0a0a0a] to-[#0d0a06] p-8 sm:p-12 lg:p-16">
            <div className="mb-12 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#f5d67b]/50 to-transparent" />
              <span className="font-mono text-xs uppercase tracking-[0.5em] text-[#f5d67b]/80">
                A new kind of stage
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#f5d67b]/50 to-transparent" />
            </div>

            <div className="grid gap-10 lg:grid-cols-[1.2fr,1fr] lg:items-center">
              <div className="space-y-8 text-center">
                <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                  <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                    Everyone&apos;s making AI video now.
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-[#f5d67b] to-[#ff9d4d] bg-clip-text text-transparent">
                    But who&apos;s making art?
                  </span>
                </h2>

                <p className="text-lg leading-relaxed text-white/60 sm:text-xl">
                  The tools are here. The creators are emerging. Somewhere in this
                  new wave of AI-generated video, there&apos;s genuinely stunning
                  work. Uvacha is where it gets found.
                </p>
              </div>

              <div className="flex items-center justify-center">
                <svg viewBox="0 0 300 200" fill="none" className="w-full max-w-[320px]" aria-hidden="true">
                  <defs>
                    <linearGradient id="funnelGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f5d67b" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#f5d67b" stopOpacity="0.08" />
                    </linearGradient>
                  </defs>
                  {/* Incoming videos */}
                  <rect x="15" y="12" width="44" height="30" rx="5" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <rect x="68" y="8" width="44" height="30" rx="5" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <rect x="121" y="15" width="44" height="30" rx="5" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <rect x="174" y="6" width="44" height="30" rx="5" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <rect x="227" y="18" width="44" height="30" rx="5" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <polygon points="32,22 32,36 42,29" fill="rgba(255,255,255,0.15)" />
                  <polygon points="85,18 85,32 95,25" fill="rgba(255,255,255,0.15)" />
                  <polygon points="138,25 138,39 148,32" fill="rgba(255,255,255,0.15)" />
                  <polygon points="191,16 191,30 201,23" fill="rgba(255,255,255,0.15)" />
                  <polygon points="244,28 244,42 254,35" fill="rgba(255,255,255,0.15)" />
                  {/* Funnel */}
                  <path d="M 40 58 L 260 58 L 180 138 L 120 138 Z" fill="url(#funnelGrad)" stroke="rgba(245,214,123,0.3)" strokeWidth="1.2" />
                  {/* Animated particles */}
                  <circle cx="130" cy="78" r="2.5" fill="rgba(255,255,255,0.2)"><animate attributeName="cy" values="68;128" dur="2.5s" repeatCount="indefinite" /></circle>
                  <circle cx="150" cy="88" r="2" fill="rgba(245,214,123,0.3)"><animate attributeName="cy" values="73;128" dur="3s" repeatCount="indefinite" /></circle>
                  <circle cx="170" cy="73" r="2.5" fill="rgba(255,255,255,0.15)"><animate attributeName="cy" values="68;128" dur="2s" repeatCount="indefinite" /></circle>
                  {/* Golden output */}
                  <circle cx="150" cy="170" r="30" fill="rgba(245,214,123,0.06)" />
                  <rect x="125" y="152" width="50" height="36" rx="6" fill="rgba(245,214,123,0.12)" stroke="#f5d67b" strokeWidth="1.5" />
                  <polygon points="143,162 143,178 157,170" fill="rgba(245,214,123,0.7)" />
                </svg>
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

      {/* Stats + CTA Section — with Scale graphic */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="overflow-hidden rounded-[3rem] border border-white/10 bg-gradient-to-br from-[#f5d67b]/5 via-black/40 to-black/60 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-10 p-8 text-center sm:p-12 lg:flex-row lg:text-left">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                This is where AI artists get found.
              </h2>

              <p className="text-white/60">
                Enter the daily arena. Share your process. Learn from others.
                When the community loves your work, you get paid. Simple as that.
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

              <div className="flex flex-wrap justify-center gap-4 pt-2 lg:justify-start">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center rounded-2xl border border-white/10 bg-black/40 px-6 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
                  >
                    <p className="text-xl font-bold text-[#f5d67b] sm:text-2xl">{stat.value}</p>
                    <p className="text-[0.6rem] uppercase tracking-[0.35em] text-white/50">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center lg:w-[320px]">
              <svg viewBox="0 0 300 200" fill="none" className="w-full max-w-[300px]" aria-hidden="true">
                <defs>
                  <linearGradient id="beamGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f5d67b" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="white" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                {/* Fulcrum */}
                <polygon points="150,195 138,170 162,170" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <circle cx="150" cy="166" r="3" fill="rgba(245,214,123,0.4)" />
                {/* Beam */}
                <line x1="40" y1="145" x2="260" y2="125" stroke="url(#beamGrad)" strokeWidth="2" strokeLinecap="round" />
                {/* Art side (left, lower) */}
                <text x="55" y="136" fill="rgba(245,214,123,0.7)" fontSize="9" fontFamily="monospace" letterSpacing="0.15em">ART</text>
                <line x1="55" y1="148" x2="55" y2="162" stroke="rgba(245,214,123,0.25)" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="95" y1="144" x2="95" y2="158" stroke="rgba(245,214,123,0.25)" strokeWidth="1" strokeDasharray="2 2" />
                <rect x="40" y="162" width="70" height="3" rx="1.5" fill="rgba(245,214,123,0.3)" />
                <rect x="52" y="128" width="38" height="16" rx="3" fill="rgba(245,214,123,0.12)" stroke="#f5d67b" strokeWidth="1.2" />
                <polygon points="65,133 65,141 74,137" fill="rgba(245,214,123,0.6)" />
                <circle cx="71" cy="136" r="20" fill="rgba(245,214,123,0.04)" />
                {/* Slop side (right, higher) */}
                <text x="210" y="116" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace" letterSpacing="0.15em">SLOP</text>
                <line x1="215" y1="128" x2="215" y2="140" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="250" y1="126" x2="250" y2="138" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2 2" />
                <rect x="200" y="140" width="65" height="3" rx="1.5" fill="rgba(255,255,255,0.1)" />
                <rect x="207" y="98" width="30" height="14" rx="3" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
                <rect x="212" y="93" width="30" height="14" rx="3" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
                <rect x="230" y="103" width="30" height="14" rx="3" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
                <g stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" strokeLinecap="round">
                  <line x1="218" y1="100" x2="226" y2="108" /><line x1="226" y1="100" x2="218" y2="108" />
                  <line x1="241" y1="106" x2="249" y2="114" /><line x1="249" y1="106" x2="241" y2="114" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
