import { NextResponse } from "next/server";

import { getVideoRatingSummary, getViewerVideoRating } from "@/lib/video-ratings";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const MIN_RATING = 1;
const MAX_RATING = 5;

export async function GET(_request: Request, { params }: RouteContext) {
  const { id: videoId } = await params;

  if (!videoId) {
    return NextResponse.json({ error: "Missing video id" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Supabase auth error while resolving viewer rating", authError);
    }

    const [summary, viewerRating] = await Promise.all([
      getVideoRatingSummary(videoId),
      getViewerVideoRating(videoId, user?.id ?? null),
    ]);

    return NextResponse.json({
      average: summary.average,
      count: summary.count,
      viewerRating,
      canRate: Boolean(user),
    });
  } catch (error) {
    console.error("Failed to load video ratings", error);
    return NextResponse.json({ error: "Unable to load ratings" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id: videoId } = await params;

  if (!videoId) {
    return NextResponse.json({ error: "Missing video id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const rating = Number(body?.rating);

    if (!Number.isInteger(rating) || rating < MIN_RATING || rating > MAX_RATING) {
      return NextResponse.json(
        { error: `Rating must be a whole number between ${MIN_RATING} and ${MAX_RATING}.` },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Supabase auth error while posting rating", authError);
      return NextResponse.json({ error: "Failed to authenticate request" }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error: upsertError } = await supabase
      .from("video_ratings")
      .upsert(
        {
          video_id: videoId,
          profile_id: user.id,
          rating,
        },
        {
          onConflict: "video_id,profile_id",
        }
      );

    if (upsertError) {
      console.error("Failed to record rating", upsertError);
      return NextResponse.json({ error: "Unable to save rating" }, { status: 500 });
    }

    const summary = await getVideoRatingSummary(videoId);

    return NextResponse.json({
      average: summary.average,
      count: summary.count,
      viewerRating: rating,
      canRate: true,
    });
  } catch (error) {
    console.error("Failed to submit video rating", error);
    return NextResponse.json({ error: "Unable to submit rating" }, { status: 500 });
  }
}


