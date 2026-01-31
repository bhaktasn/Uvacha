import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { UserAvatar } from "@/components/UserAvatar";
import { getMuxThumbnailUrl } from "@/lib/mux/thumbnails";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type VideoRow = Database["public"]["Tables"]["videos"]["Row"];

type PublicProfile = Pick<
  ProfileRow,
  "id" | "username" | "avatar_url" | "banner_url" | "bio" | "twitter_handle" | "instagram_handle" | "created_at"
>;

type VideoPreview = Pick<
  VideoRow,
  "id" | "title" | "description" | "created_at" | "generation_source" | "mux_playback_id" | "view_count"
>;

interface UserProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export const revalidate = 60;

const joinedDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});

const videoDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

async function fetchUserProfile(username: string): Promise<PublicProfile | null> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id,username,avatar_url,banner_url,bio,twitter_handle,instagram_handle,created_at")
      .eq("username", username.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch profile", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unable to fetch profile", error);
    return null;
  }
}

async function fetchUserVideos(profileId: string): Promise<VideoPreview[]> {
  try {
    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from("videos")
      .select("id,title,description,created_at,generation_source,mux_playback_id,view_count")
      .eq("profile_id", profileId)
      .lte("unlock_at", now)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch user videos", error);
      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error("Unable to fetch videos", error);
    return [];
  }
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = await params;
  const profile = await fetchUserProfile(username);

  if (!profile) {
    notFound();
  }

  const videos = await fetchUserVideos(profile.id);
  const hasVideos = videos.length > 0;
  const totalViews = videos.reduce((sum, video) => sum + (video.view_count ?? 0), 0);

  return (
    <div className="relative isolate min-h-[calc(100vh-5rem)]">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-6 top-0 h-72 w-72 rounded-full bg-[#f5d67b]/15 blur-[170px]" />
        <div className="absolute bottom-[-4rem] left-5 h-80 w-80 rounded-full bg-[#f0b90b]/10 blur-[190px]" />
      </div>

      {/* Banner Section */}
      <div className="relative h-48 w-full overflow-hidden sm:h-64 lg:h-80">
        {profile.banner_url ? (
          <Image
            src={profile.banner_url}
            alt={`${profile.username}'s banner`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#050505]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(245,214,123,0.15),_transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_rgba(192,143,44,0.1),_transparent_40%)]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
      </div>

      {/* Profile Info Section */}
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative -mt-16 sm:-mt-20">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
            {/* Avatar */}
            <div className="relative">
              <div className="rounded-full border-4 border-[#050505] shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
                <UserAvatar
                  avatarUrl={profile.avatar_url}
                  username={profile.username}
                  size="xl"
                  className="h-28 w-28 sm:h-36 sm:w-36"
                />
              </div>
            </div>

            {/* Profile Details */}
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-bold text-white sm:text-4xl">
                @{profile.username}
              </h1>
              {profile.bio && (
                <p className="mt-2 max-w-2xl text-base text-white/70">
                  {profile.bio}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <span className="text-white/50">
                  Joined {joinedDateFormatter.format(new Date(profile.created_at))}
                </span>
                <span className="text-white/30">•</span>
                <span className="text-white/50">
                  {videos.length} video{videos.length !== 1 ? "s" : ""}
                </span>
                <span className="text-white/30">•</span>
                <span className="text-white/50">
                  {totalViews.toLocaleString()} view{totalViews !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap gap-3 pb-2">
              {profile.twitter_handle && (
                <a
                  href={`https://twitter.com/${profile.twitter_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:border-[#1DA1F2]/50 hover:text-[#1DA1F2]"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  @{profile.twitter_handle}
                </a>
              )}
              {profile.instagram_handle && (
                <a
                  href={`https://instagram.com/${profile.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:border-[#E4405F]/50 hover:text-[#E4405F]"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  @{profile.instagram_handle}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Videos Section */}
        <div className="mt-12 pb-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Videos
            </h2>
            <span className="text-sm text-white/50">
              {videos.length} released
            </span>
          </div>

          {hasVideos ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
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
                    <h3 className="line-clamp-2 text-lg font-semibold text-white">
                      {video.title}
                    </h3>
                    <p className="line-clamp-2 text-sm text-white/60">
                      {video.description}
                    </p>
                    <div className="mt-auto flex items-center gap-3 text-xs uppercase tracking-[0.4em] text-white/40">
                      <span>{(video.view_count ?? 0).toLocaleString()} views</span>
                      <span>•</span>
                      <span>{videoDateFormatter.format(new Date(video.created_at))}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center text-white/50">
              @{profile.username} hasn&apos;t released any videos yet. Check back soon!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: UserProfilePageProps) {
  const { username } = await params;
  const profile = await fetchUserProfile(username);

  if (!profile) {
    return {
      title: "User Not Found | Uvacha",
    };
  }

  return {
    title: `@${profile.username} | Uvacha`,
    description: profile.bio || `Check out @${profile.username}'s videos on Uvacha`,
  };
}

