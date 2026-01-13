import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getViewerId } from "@/lib/supabase/viewer";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type VoteDirection = "up" | "down" | "clear";

const VALID_DIRECTIONS: VoteDirection[] = ["up", "down", "clear"];

export async function POST(request: Request, { params }: RouteContext) {
  const { id: commentId } = await params;

  if (!commentId) {
    return NextResponse.json({ error: "Missing comment id" }, { status: 400 });
  }

  const viewerId = await getViewerId();

  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let direction: VoteDirection | null = null;
  try {
    const body = await request.json();
    const inputDirection = body?.direction;
    if (typeof inputDirection === "string") {
      const normalized = inputDirection.toLowerCase();
      direction = VALID_DIRECTIONS.find((value) => value === normalized) ?? null;
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!direction) {
    return NextResponse.json(
      { error: 'direction must be "up", "down", or "clear"' },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdminClient();

  const { data: existingComment, error: commentError } = await supabase
    .from("comments")
    .select("id")
    .eq("id", commentId)
    .maybeSingle();

  if (commentError) {
    console.error("Failed to verify comment before voting", commentError);
    return NextResponse.json({ error: "Unable to process vote" }, { status: 500 });
  }

  if (!existingComment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (direction === "clear") {
    const { error: deleteError } = await supabase
      .from("comment_votes")
      .delete()
      .eq("comment_id", commentId)
      .eq("profile_id", viewerId);

    if (deleteError) {
      console.error("Failed to clear comment vote", deleteError);
      return NextResponse.json({ error: "Unable to update vote" }, { status: 500 });
    }
  } else {
    const value = direction === "up" ? 1 : -1;

    const { error: upsertError } = await supabase
      .from("comment_votes")
      .upsert(
        {
          comment_id: commentId,
          profile_id: viewerId,
          value,
        },
        { onConflict: "comment_id,profile_id" },
      );

    if (upsertError) {
      console.error("Failed to upsert comment vote", upsertError);
      return NextResponse.json({ error: "Unable to update vote" }, { status: 500 });
    }
  }

  const { data: voteRows, error: voteError } = await supabase
    .from("comment_votes")
    .select("profile_id, value")
    .eq("comment_id", commentId);

  if (voteError) {
    console.error("Failed to recalculate comment score", voteError);
    return NextResponse.json({ error: "Unable to finalize vote" }, { status: 500 });
  }

  const votes = (voteRows ?? []) as { profile_id: string; value: number }[];
  const score = votes.reduce((total, vote) => total + vote.value, 0);
  const viewerVote = votes.find((vote) => vote.profile_id === viewerId)?.value ?? 0;

  return NextResponse.json({ commentId, score, viewerVote });
}


