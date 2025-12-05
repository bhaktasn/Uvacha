import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface VideoRatingSummary {
  average: number | null;
  count: number;
}

const DEFAULT_SUMMARY: VideoRatingSummary = {
  average: null,
  count: 0,
};

export async function getVideoRatingSummary(videoId: string): Promise<VideoRatingSummary> {
  if (!videoId) {
    return DEFAULT_SUMMARY;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("video_ratings")
      .select("rating")
      .eq("video_id", videoId);

    if (error || !data) {
      if (error) {
        console.error(`[video_ratings] Failed to load summary for ${videoId}`, error);
      }
      return DEFAULT_SUMMARY;
    }

    if (data.length === 0) {
      return DEFAULT_SUMMARY;
    }

    const total = data.reduce((sum, row) => sum + row.rating, 0);
    const average = total / data.length;

    return {
      average,
      count: data.length,
    };
  } catch (err) {
    console.error(`[video_ratings] Unexpected error while loading summary for ${videoId}`, err);
    return DEFAULT_SUMMARY;
  }
}

export async function getViewerVideoRating(
  videoId: string,
  viewerId: string | null
): Promise<number | null> {
  if (!videoId || !viewerId) {
    return null;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("video_ratings")
      .select("rating")
      .eq("video_id", videoId)
      .eq("profile_id", viewerId)
      .maybeSingle();

    if (error) {
      console.error(
        `[video_ratings] Failed to resolve viewer rating for ${videoId}/${viewerId}`,
        error
      );
      return null;
    }

    return data?.rating ?? null;
  } catch (err) {
    console.error(
      `[video_ratings] Unexpected error resolving viewer rating for ${videoId}/${viewerId}`,
      err
    );
    return null;
  }
}


