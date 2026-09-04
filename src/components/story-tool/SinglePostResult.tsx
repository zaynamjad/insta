"use client";

import { useState } from "react";
import type { PostLookupResult } from "@/types/post";
import { DownloadButton } from "./DownloadButton";

/** Shown below the search box when the input was a pasted post/reel URL rather than a username. */
export function SinglePostResult({
  result,
  onReset,
}: {
  result: PostLookupResult;
  onReset: () => void;
}) {
  const [itemIndex, setItemIndex] = useState(0);

  if (result.status === "error") {
    return (
      <ErrorCard onReset={onReset}>{result.message}</ErrorCard>
    );
  }

  if (result.status === "not_found") {
    return (
      <ErrorCard onReset={onReset}>
        We couldn&apos;t find a public post at that link.
      </ErrorCard>
    );
  }

  const { post } = result;
  const item = post.items[Math.min(itemIndex, post.items.length - 1)];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex justify-end">
        <button
          onClick={onReset}
          className="shrink-0 text-sm font-medium text-foreground/50 hover:text-foreground"
        >
          Search another
        </button>
      </div>

      <div className="mx-auto mt-2 max-w-sm">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-muted">
          {item?.type === "video" ? (
            <video
              key={item.mediaUrl}
              src={item.mediaUrl}
              className="h-full w-full object-contain"
              controls
              playsInline
            />
          ) : item ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={item.mediaUrl} src={item.mediaUrl} alt="" className="h-full w-full object-contain" />
          ) : null}

          {post.items.length > 1 && (
            <>
              <button
                aria-label="Previous item"
                disabled={itemIndex === 0}
                onClick={() => setItemIndex((i) => Math.max(0, i - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white disabled:opacity-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button
                aria-label="Next item"
                disabled={itemIndex === post.items.length - 1}
                onClick={() => setItemIndex((i) => Math.min(post.items.length - 1, i + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white disabled:opacity-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
              <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
                {post.items.map((_, i) => (
                  <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === itemIndex ? "bg-white" : "bg-white/40"}`} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {post.caption && (
              <p className="line-clamp-3 text-sm leading-relaxed text-foreground/80">{post.caption}</p>
            )}
            <div className="mt-2 flex gap-3 text-xs text-foreground/50">
              {typeof post.likeCount === "number" && <span>{post.likeCount.toLocaleString()} likes</span>}
              {typeof post.commentCount === "number" && <span>{post.commentCount.toLocaleString()} comments</span>}
            </div>
          </div>

          {item && (
            <DownloadButton
              mediaUrl={item.mediaUrl}
              label="Download"
              showLabel
              className="brand-gradient flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorCard({ children, onReset }: { children: React.ReactNode; onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <p className="text-sm leading-relaxed text-foreground/75">{children}</p>
      <button onClick={onReset} className="mt-4 text-sm font-semibold text-accent hover:underline">
        Search another
      </button>
    </div>
  );
}
