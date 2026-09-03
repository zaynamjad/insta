"use client";

import { useEffect, useState } from "react";
import type { PostsLookupResult, Post } from "@/types/post";
import { DownloadButton } from "./DownloadButton";
import { PostViewerModal } from "./PostViewerModal";

/**
 * Self-contained Posts tab: fetches lazily on mount (only when the tab is
 * actually rendered, since a posts fetch is a separate, separately billed
 * HikerAPI call the user might never ask for) and owns its own
 * loading/error/grid state.
 */
export function PostsGrid({ username }: { username: string }) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const [posts, setPosts] = useState<Post[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");
      try {
        const res = await fetch("/api/posts-viewer/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        const data: PostsLookupResult = await res.json();
        if (cancelled) return;

        if (data.status === "ok") {
          setPosts(data.posts);
          setState("loaded");
        } else if (data.status === "not_found" || data.status === "private") {
          setPosts([]);
          setState("loaded");
        } else {
          setErrorMessage(data.message);
          setState("error");
        }
      } catch {
        if (!cancelled) {
          setErrorMessage("We couldn't retrieve posts right now. Please try again later.");
          setState("error");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (state === "loading") {
    return (
      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-skeleton aspect-square rounded-xl bg-surface-muted" />
        ))}
      </div>
    );
  }

  if (state === "error") {
    return <p className="mt-5 text-sm text-foreground/60">{errorMessage}</p>;
  }

  if (posts.length === 0) {
    return <p className="mt-5 text-sm text-foreground/60">No public posts found for this username.</p>;
  }

  return (
    <>
      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {posts.map((post, index) => {
          const cover = post.items[0];
          return (
            <div
              key={post.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-muted"
            >
              <button
                onClick={() => setViewerIndex(index)}
                className="absolute inset-0 h-full w-full"
                aria-label={`Open post ${index + 1}`}
              >
                {cover?.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                {post.items.length > 1 && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-black/50 p-1 text-white">
                    <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 8h12v12H4z" opacity=".5" />
                      <path d="M8 4h12v12H8z" />
                    </svg>
                  </span>
                )}
                <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
              </button>
              {/* Sibling, not nested inside the button above — an <a> inside a <button> is invalid HTML and misfires clicks. */}
              {cover && (
                <DownloadButton
                  mediaUrl={cover.mediaUrl}
                  label={`Download post ${index + 1}`}
                  className="absolute bottom-1.5 right-1.5 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                />
              )}
            </div>
          );
        })}
      </div>

      {viewerIndex !== null && (
        <PostViewerModal
          posts={posts}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}
