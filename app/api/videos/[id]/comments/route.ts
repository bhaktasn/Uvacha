import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getViewerId } from "@/lib/supabase/viewer";
import type { Database } from "@/lib/types/database";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type CommentWithProfile = CommentRow & {
  profiles: Pick<ProfileRow, "username"> | null;
};

const COMMENT_MAX_LENGTH = 750;

export async function GET(_request: Request, { params }: RouteContext) {
  const { id: videoId } = await params;

  if (!videoId) {
    return NextResponse.json({ error: "Missing video id" }, { status: 400 });
  }

  const viewerId = await getViewerId();
  const supabase = getSupabaseAdminClient();

  const { data: rawComments, error } = await supabase
    .from("comments")
    .select(
      "id, video_id, profile_id, content, created_at, profiles!comments_profile_id_fkey(username)"
    )
    .eq("video_id", videoId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load comments", error);
    return NextResponse.json({ error: "Unable to load comments" }, { status: 500 });
  }

  const commentRows: CommentWithProfile[] = (rawComments ?? []) as CommentWithProfile[];

  const commentIds = commentRows.map((comment) => comment.id);
  let voteRows: { comment_id: string; profile_id: string; value: number }[] = [];

  if (commentIds.length > 0) {
    const { data: votes, error: votesError } = await supabase
      .from("comment_votes")
      .select("comment_id, profile_id, value")
      .in("comment_id", commentIds);

    if (votesError) {
      console.error("Failed to load comment votes", votesError);
      return NextResponse.json({ error: "Unable to load comment votes" }, { status: 500 });
    }

    voteRows = votes ?? [];
  }

  const comments = commentRows.map((comment) => {
    const votesForComment = voteRows.filter((vote) => vote.comment_id === comment.id);
    const score = votesForComment.reduce((total, vote) => total + vote.value, 0);
    const viewerVote =
      viewerId != null
        ? votesForComment.find((vote) => vote.profile_id === viewerId)?.value ?? 0
        : 0;

    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.created_at,
      username: comment.profiles?.username ?? null,
      score,
      viewerVote,
    };
  });

  return NextResponse.json({ comments });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id: videoId } = await params;

  if (!videoId) {
    return NextResponse.json({ error: "Missing video id" }, { status: 400 });
  }

  const viewerId = await getViewerId();

  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let content: string = "";
  try {
    const body = await request.json();
    content = (body?.content ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!content) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  if (content.length > COMMENT_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Comment must be under ${COMMENT_MAX_LENGTH} characters` },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdminClient();

  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("id")
    .eq("id", videoId)
    .maybeSingle();

  if (videoError) {
    console.error("Failed to validate video before commenting", videoError);
    return NextResponse.json({ error: "Unable to create comment" }, { status: 500 });
  }

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const { data, error: insertError } = await supabase
    .from("comments")
    .insert({
      video_id: videoId,
      profile_id: viewerId,
      content,
    })
    .select("id, content, created_at, profiles!comments_profile_id_fkey(username)")
    .single();

  if (insertError) {
    console.error("Failed to insert comment", insertError);
    return NextResponse.json({ error: "Unable to save comment" }, { status: 500 });
  }

  const newComment = (data ?? null) as CommentWithProfile | null;

  if (!newComment) {
    console.error("Supabase did not return a comment payload after insert");
    return NextResponse.json({ error: "Unable to save comment" }, { status: 500 });
  }

  const comment = {
    id: newComment.id,
    content: newComment.content,
    createdAt: newComment.created_at,
    username: newComment.profiles?.username ?? null,
    score: 0,
    viewerVote: 0,
  };

  return NextResponse.json({ comment }, { status: 201 });
}


