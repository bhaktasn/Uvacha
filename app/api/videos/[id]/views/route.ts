import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id: videoId } = await params;

  if (!videoId) {
    return NextResponse.json({ error: "Missing video id" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("videos")
      .select("view_count")
      .eq("id", videoId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch video view count", error);
      return NextResponse.json({ error: "Unable to load views" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ viewCount: data.view_count ?? 0 });
  } catch (error) {
    console.error("Unexpected error while fetching video view count", error);
    return NextResponse.json({ error: "Unable to load views" }, { status: 500 });
  }
}

export async function POST(_request: Request, { params }: RouteContext) {
  const { id: videoId } = await params;

  if (!videoId) {
    return NextResponse.json({ error: "Missing video id" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.rpc("increment_video_view_count", {
      video_uuid: videoId,
    });

    if (error) {
      console.error("Failed to increment video views", error);
      return NextResponse.json({ error: "Unable to record view" }, { status: 500 });
    }

    if (typeof data !== "number") {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ viewCount: data });
  } catch (error) {
    console.error("Unexpected error while recording video view", error);
    return NextResponse.json({ error: "Unable to record view" }, { status: 500 });
  }
}


