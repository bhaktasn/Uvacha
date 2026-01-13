'use client';

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type VoteDirection = "up" | "down" | "clear";

type CommentRecord = {
  id: string;
  content: string;
  createdAt: string;
  username: string | null;
  score: number;
  viewerVote: -1 | 0 | 1;
};

interface VideoCommentsProps {
  videoId: string;
  viewerId: string | null;
}

const COMMENT_MAX_LENGTH = 750;

export function VideoComments({ videoId, viewerId }: VideoCommentsProps) {
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timestampFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    [],
  );

  const fetchComments = useCallback(
    async (isRefetch = false) => {
      if (isRefetch) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setListError(null);

      try {
        const response = await fetch(`/api/videos/${videoId}/comments`, {
          cache: "no-store",
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load comments");
        }

        setComments(Array.isArray(payload?.comments) ? payload.comments : []);
      } catch (error) {
        console.error(error);
        setListError(
          error instanceof Error ? error.message : "Unable to load comments",
        );
      } finally {
        if (isRefetch) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [videoId],
  );

  useEffect(() => {
    void fetchComments(false);
  }, [fetchComments]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!viewerId) {
      setFormError("Sign in to share your thoughts.");
      return;
    }

    const trimmed = content.trim();

    if (!trimmed) {
      setFormError("Comment cannot be empty.");
      return;
    }

    if (trimmed.length > COMMENT_MAX_LENGTH) {
      setFormError(`Comment must be under ${COMMENT_MAX_LENGTH} characters.`);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: trimmed }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to post comment");
      }

      if (payload?.comment) {
        setComments((prev) => [payload.comment as CommentRecord, ...prev]);
      } else {
        void fetchComments(true);
      }

      setContent("");
    } catch (error) {
      console.error(error);
      setFormError(
        error instanceof Error ? error.message : "Unable to post comment",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendVote = async (commentId: string, direction: VoteDirection) => {
    if (!viewerId) {
      setListError("Sign in to vote on comments.");
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ direction }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to update vote");
      }

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                score: payload?.score ?? comment.score,
                viewerVote:
                  typeof payload?.viewerVote === "number"
                    ? payload.viewerVote
                    : comment.viewerVote,
              }
            : comment,
        ),
      );
      setListError(null);
    } catch (error) {
      console.error(error);
      setListError(
        error instanceof Error ? error.message : "Unable to update vote",
      );
    }
  };

  const handleVote = (comment: CommentRecord, direction: "up" | "down") => {
    const isCurrentlySelected =
      (direction === "up" && comment.viewerVote === 1) ||
      (direction === "down" && comment.viewerVote === -1);
    const nextDirection: VoteDirection = isCurrentlySelected
      ? "clear"
      : direction;

    void sendVote(comment.id, nextDirection);
  };

  const renderComment = (comment: CommentRecord) => {
    const createdAt = timestampFormatter.format(new Date(comment.createdAt));
    const username = comment.username ? `@${comment.username}` : "Anonymous";

    return (
      <li
        key={comment.id}
        className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">{username}</p>
            <p className="text-xs text-white/50">{createdAt}</p>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <button
              type="button"
              onClick={() => handleVote(comment, "up")}
              disabled={viewerId == null}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-base ${
                comment.viewerVote === 1
                  ? "border-[#f5d67b] text-[#f5d67b]"
                  : "border-white/15 text-white/70 hover:border-white/40 hover:text-white"
              }`}
              aria-label="Upvote comment"
              title={viewerId ? "Upvote" : "Sign in to vote"}
            >
              ▲
            </button>
            <span className="text-sm font-semibold text-white">{comment.score}</span>
            <button
              type="button"
              onClick={() => handleVote(comment, "down")}
              disabled={viewerId == null}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-base ${
                comment.viewerVote === -1
                  ? "border-[#f5d67b] text-[#f5d67b]"
                  : "border-white/15 text-white/70 hover:border-white/40 hover:text-white"
              }`}
              aria-label="Downvote comment"
              title={viewerId ? "Downvote" : "Sign in to vote"}
            >
              ▼
            </button>
          </div>
        </div>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/80">
          {comment.content}
        </p>
      </li>
    );
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-black/50 p-6 shadow-[0_35px_140px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#f5d67b]">
            Comments
          </p>
          <p className="text-sm text-white/60">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchComments(true)}
          disabled={loading || refreshing}
          className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {listError ? (
        <p className="mt-3 text-sm text-red-400">{listError}</p>
      ) : null}

      {viewerId ? (
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Share your thoughts on this drop..."
            maxLength={COMMENT_MAX_LENGTH}
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#f5d67b]/60 focus:outline-none focus:ring-0 disabled:opacity-60"
            disabled={isSubmitting}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-white/40">
              {content.length}/{COMMENT_MAX_LENGTH}
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="rounded-full border border-[#f5d67b]/50 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#f5d67b] transition hover:border-[#f5d67b] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Posting..." : "Post"}
            </button>
          </div>
          {formError ? (
            <p className="text-sm text-red-400">{formError}</p>
          ) : null}
        </form>
      ) : (
        <p className="mt-5 text-sm text-white/70">
          <Link
            href="/login"
            className="text-[#f5d67b] underline underline-offset-4 transition hover:text-white"
          >
            Sign in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-white/60">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-white/60">
            Be the first to start the discussion.
          </p>
        ) : (
          <ul className="space-y-4">{comments.map(renderComment)}</ul>
        )}
      </div>
    </section>
  );
}


