import Link from "next/link";

import { VideoCard } from "@/components/VideoCard";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";

type VideoRow = Database["public"]["Tables"]["videos"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type SearchResult = Pick<
  VideoRow,
  "id" | "title" | "description" | "created_at" | "generation_source" | "mux_playback_id"
> & {
  profiles: Pick<ProfileRow, "username" | "avatar_url"> | null;
};

type RawSearchResult = Omit<SearchResult, "profiles"> & {
  profiles: SearchResult["profiles"] | SearchResult["profiles"][] | null;
};

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 50;

export const revalidate = 0;
export const dynamic = "force-dynamic";

// Only sanitize SQL wildcards that could cause issues, preserve underscores for usernames
const sanitizeQuery = (query: string) => query.replace(/[%]/g, "").replace(/\s+/g, " ").trim();

async function searchVideos(query: string): Promise<SearchResult[]> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  // Search videos by title and description
  const videoSearchPromise = supabase
    .from("videos")
    .select(
      "id,title,description,created_at,generation_source,mux_playback_id,profiles:profiles!videos_profile_id_fkey(username,avatar_url)",
    )
    .lte("unlock_at", now)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order("created_at", { ascending: false })
    .limit(MAX_RESULTS);

  // Search profiles by username and get their videos
  const profileSearchPromise = supabase
    .from("profiles")
    .select("id")
    .ilike("username", `%${query}%`)
    .limit(50);

  const [videoResult, profileResult] = await Promise.all([videoSearchPromise, profileSearchPromise]);

  if (videoResult.error) {
    throw videoResult.error;
  }

  const videosFromTitleDesc = (videoResult.data ?? []) as RawSearchResult[];

  // If we found matching profiles, fetch their videos too
  let videosFromProfiles: RawSearchResult[] = [];
  if (profileResult.data && profileResult.data.length > 0) {
    const profileIds = profileResult.data.map((p) => p.id);
    const { data: profileVideos, error: profileVideosError } = await supabase
      .from("videos")
      .select(
        "id,title,description,created_at,generation_source,mux_playback_id,profiles:profiles!videos_profile_id_fkey(username,avatar_url)",
      )
      .lte("unlock_at", now)
      .in("profile_id", profileIds)
      .order("created_at", { ascending: false })
      .limit(MAX_RESULTS);

    if (!profileVideosError && profileVideos) {
      videosFromProfiles = profileVideos as RawSearchResult[];
    }
  }

  // Merge and deduplicate results, prioritizing videos from title/desc search
  const seenIds = new Set<string>();
  const mergedResults: RawSearchResult[] = [];

  for (const video of videosFromTitleDesc) {
    if (!seenIds.has(video.id)) {
      seenIds.add(video.id);
      mergedResults.push(video);
    }
  }

  for (const video of videosFromProfiles) {
    if (!seenIds.has(video.id)) {
      seenIds.add(video.id);
      mergedResults.push(video);
    }
  }

  // Sort by created_at descending and limit
  mergedResults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const limitedResults = mergedResults.slice(0, MAX_RESULTS);

  return limitedResults.map((video) => ({
    ...video,
    profiles: Array.isArray(video.profiles) ? video.profiles[0] ?? null : video.profiles ?? null,
  }));
}

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const rawQueryParam = resolvedParams?.q;
  const rawQuery = Array.isArray(rawQueryParam) ? rawQueryParam[0] ?? "" : rawQueryParam ?? "";
  const trimmedQuery = rawQuery.trim();
  const sanitizedQuery = sanitizeQuery(trimmedQuery);
  const meetsLengthRequirements = trimmedQuery.length >= MIN_QUERY_LENGTH && sanitizedQuery.length > 0;

  let results: SearchResult[] = [];
  let fetchError: string | null = null;

  if (meetsLengthRequirements) {
    try {
      results = await searchVideos(sanitizedQuery);
    } catch (error) {
      console.error("Video search failed", error);
      fetchError = "We couldn't search the catalog right now. Try again in a moment.";
    }
  }

  const shouldPromptForQuery = trimmedQuery.length === 0;
  const shouldAskForMoreCharacters = trimmedQuery.length > 0 && !meetsLengthRequirements;
  const hasResults = results.length > 0;

  return (
    <div className="relative isolate px-6 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-6 top-0 h-72 w-72 rounded-full bg-[#f5d67b]/15 blur-[170px]" />
        <div className="absolute bottom-[-4rem] left-5 h-80 w-80 rounded-full bg-[#f0b90b]/10 blur-[190px]" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        {fetchError && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-100">
            {fetchError}
          </div>
        )}

        {shouldPromptForQuery && !fetchError && (
          <div className="rounded-3xl border border-dashed border-white/20 bg-black/40 px-8 py-10 text-center text-white/60">
            Start typing in the search bar to find videos. Need inspiration? Head back to the{" "}
            <Link href="/" className="text-[#f5d67b] hover:underline">
              home feed
            </Link>{" "}
            or check the{" "}
            <Link href="/videos" className="text-[#f5d67b] hover:underline">
              library view
            </Link>
            .
          </div>
        )}

        {shouldAskForMoreCharacters && !fetchError && (
          <div className="rounded-3xl border border-white/15 bg-black/40 px-8 py-6 text-center text-sm text-white/70">
            Please enter at least {MIN_QUERY_LENGTH} characters to search the catalog.
          </div>
        )}

        {meetsLengthRequirements && !fetchError && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm uppercase tracking-[0.35em] text-white/50">
                {hasResults
                  ? `${results.length} result${results.length === 1 ? "" : "s"} for "${trimmedQuery}"`
                  : `No matches for "${trimmedQuery}"`}
              </p>
            </div>

            {hasResults ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((video) => (
                  <VideoCard
                    key={video.id}
                    id={video.id}
                    title={video.title}
                    description={video.description}
                    createdAt={video.created_at}
                    generationSource={video.generation_source}
                    muxPlaybackId={video.mux_playback_id}
                    creatorUsername={video.profiles?.username ?? null}
                    creatorAvatarUrl={video.profiles?.avatar_url}
                    showDescription
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/20 bg-black/30 px-8 py-10 text-center text-white/60">
                No competing videos matched your search. Try another phrase or verify your spelling.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

