import Image from "next/image";
import Link from "next/link";

import HeroCover from "@/app/assets/Cover Image-1.jpg";
import Glyph from "@/app/assets/Icon Transparency-1.png";
import { getMuxThumbnailUrl } from "@/lib/mux/thumbnails";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";

type VideoRow = Database["public"]["Tables"]["videos"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type VideoPreview = Pick<
  VideoRow,
  "id" | "title" | "created_at" | "generation_source" | "mux_playback_id"
> & {
  profiles: Pick<ProfileRow, "username"> | null;
};
type RawVideoPreview = Omit<VideoPreview, "profiles"> & {
  profiles: VideoPreview["profiles"] | VideoPreview["profiles"][] | null;
};

export const revalidate = 60;

const features = [
  {
    title: "Wallet-perfect onboarding",
    description:
      "Capture USDC wallets with instant multi-chain validation so every drop routes funds safely.",
    tag: "Finance Ops",
  },
  {
    title: "MUX-native video releases",
    description:
      "Direct upload sessions, background processing, and unlock scheduling keep premieres cinematic.",
    tag: "Video",
  },
  {
    title: "Social proof baked in",
    description:
      "Normalize Twitter/X & Instagram handles to make every profile linkable from day one.",
    tag: "Community",
  },
  {
    title: "Human vs AI tracking",
    description:
      "Label each asset by its generation source to communicate authenticity in a single glance.",
    tag: "Transparency",
  },
] as const;

const stats = [
  { label: "Creator setup", value: "5 min" },
  { label: "Wallet accuracy", value: "99.9%" },
  { label: "Scheduled drops", value: "24/7" },
] as const;

const workflow = [
  "Create an account or sign in securely.",
  "Store socials + wallets once—reuse across every release.",
  "Upload to MUX, choose AI or human credits, schedule the unlock.",
  "Share playback URLs when the countdown hits zero.",
] as const;

const uploadDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const formatCreatorHandle = (username?: string | null) =>
  username ? `@${username}` : "Unknown creator";

async function fetchLatestVideos(): Promise<VideoPreview[]> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("videos")
      .select(
        "id,title,created_at,generation_source,mux_playback_id,profiles:profiles!videos_profile_id_fkey(username)"
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
                <Link
                  key={video.id}
                  href={`/videos/${video.id}`}
                  className="group flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_25px_80px_rgba(0,0,0,0.45)] transition duration-200 hover:-translate-y-1 hover:border-[#f5d67b]/60"
                >
                  <div className="relative overflow-hidden rounded-2xl border border-white/10">
                    {video.mux_playback_id ? (
                      <div className="relative aspect-video w-full">
                        <Image
                          src={
                            getMuxThumbnailUrl(video.mux_playback_id, {
                              width: 640,
                              height: 360,
                              time: 2,
                            })!
                          }
                          alt={`Preview for ${video.title}`}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-[radial-gradient(circle_at_top,_rgba(245,214,123,0.25),_transparent_55%)] transition duration-200 group-hover:scale-[1.02]" />
                    )}
                    <span className="absolute bottom-3 left-0 flex items-center gap-2 rounded-r-full bg-black/70 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/80">
                      {video.generation_source === "ai" ? "AI" : "Human"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-1 flex-col gap-2">
                    <h3 className="text-lg font-semibold text-white">
                      {video.title}
                    </h3>
                    <p className="text-sm text-white/60">
                      {formatCreatorHandle(video.profiles?.username)}
                    </p>
                    <p className="mt-auto text-xs uppercase tracking-[0.4em] text-white/40">
                      {uploadDateFormatter.format(new Date(video.created_at))}
                    </p>
                  </div>
                </Link>
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

      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-16 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#f5d67b]">
            Launch // Stream // Repeat
          </span>

          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              A black & gold cockpit for every creator drop.
            </h1>
            <p className="text-lg text-white/70 sm:text-xl">
              Uvacha merges secure onboarding, MUX-powered distribution, and tasteful brand
              tooling into one minimal control room. Plan a release once—reuse the rails forever.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full border border-[#f5d67b] bg-[#f5d67b] px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-black shadow-[0_20px_45px_rgba(245,214,123,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ffe8a0]"
            >
              Get started
            </Link>
            <Link
              href="/videos"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/80 transition hover:border-[#f5d67b]/60 hover:text-white"
            >
              Browse the stack
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
              >
                <p className="text-3xl font-semibold text-[#f5d67b]">{stat.value}</p>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="relative rounded-[2.5rem] border border-white/10 bg-[#090909]/70 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-xl">
            <div className="absolute -top-6 right-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/65">
              <Image src={Glyph} alt="Uvacha icon" width={20} height={20} className="opacity-80" />
              Live
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
              <Image
                src={HeroCover}
                alt="Creator uploading to Uvacha"
                className="h-72 w-full rounded-2xl object-cover"
                priority
              />
            </div>

            <div className="mt-6 grid gap-4 text-sm">
              {workflow.map((step, index) => (
                <div
                  key={step}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f5d67b]/20 text-sm font-semibold text-[#f5d67b]">
                    {index + 1}
                  </span>
                  <p className="text-white/80">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="flex flex-col gap-12 rounded-[2.5rem] border border-white/10 bg-black/20 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-12">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-[#f5d67b]">What you get</p>
            <h2 className="text-3xl font-semibold text-white">
              Crafted surfaces for every mission-critical workflow.
            </h2>
            <p className="text-white/65">
              Profile, wallet, and video management share the same aesthetic language so the entire
              experience feels luxury, yet familiar.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.05))" }}
              >
                <span className="inline-flex rounded-full border border-white/10 px-4 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-white/60">
                  {feature.tag}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-white/65">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/profile"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-white/80 transition hover:border-[#f5d67b]/60 hover:text-white"
            >
              Tune your profile
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-[#f5d67b] transition hover:bg-white/10"
            >
              Existing member
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
