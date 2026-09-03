"use client";

import { useEffect, useRef, useState } from "react";
import type { Post } from "@/types/post";
import { DownloadButton } from "./DownloadButton";

export function PostViewerModal({
  posts,
  initialIndex,
  onClose,
}: {
  posts: Post[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [postIndex, setPostIndex] = useState(initialIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeBtnRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const post = posts[postIndex];
  const item = post.items[itemIndex];

  function goNextPost() {
    setItemIndex(0);
    setPostIndex((i) => Math.min(posts.length - 1, i + 1));
  }
  function goPrevPost() {
    setItemIndex(0);
    setPostIndex((i) => Math.max(0, i - 1));
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Post from @${post.id}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-0 sm:p-6"
    >
      <div className="relative flex h-full w-full max-w-md flex-col sm:h-[92vh] sm:rounded-2xl sm:overflow-hidden bg-black">
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-3">
          {post.items.length > 1 && (
            <div className="flex gap-1.5">
              {post.items.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i === itemIndex ? "bg-white" : "bg-white/30"}`}
                />
              ))}
            </div>
          )}
          <div className="ml-auto flex items-center gap-1">
            {item && (
              <DownloadButton
                mediaUrl={item.mediaUrl}
                label="Download this media"
                className="rounded-full p-2 text-white/90 hover:bg-white/10"
              />
            )}
            <button
              ref={closeBtnRef}
              onClick={onClose}
              aria-label="Close post viewer"
              className="rounded-full p-2 text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="relative flex-1 select-none">
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
            <img
              key={item.mediaUrl}
              src={item.mediaUrl}
              alt=""
              className="h-full w-full object-contain"
            />
          ) : null}

          {post.items.length > 1 && (
            <>
              <button
                aria-label="Previous item"
                disabled={itemIndex === 0}
                onClick={() => setItemIndex((i) => Math.max(0, i - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white disabled:opacity-0"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button
                aria-label="Next item"
                disabled={itemIndex === post.items.length - 1}
                onClick={() => setItemIndex((i) => Math.min(post.items.length - 1, i + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white disabled:opacity-0"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </>
          )}
        </div>

        <div className="z-20 space-y-2 bg-black/80 p-4 text-white">
          {post.caption && (
            <p className="line-clamp-3 text-sm text-white/85">{post.caption}</p>
          )}
          <div className="flex items-center justify-between text-xs text-white/60">
            <div className="flex gap-3">
              {typeof post.likeCount === "number" && <span>{post.likeCount.toLocaleString()} likes</span>}
              {typeof post.commentCount === "number" && <span>{post.commentCount.toLocaleString()} comments</span>}
            </div>
            <div className="flex gap-3">
              <button onClick={goPrevPost} disabled={postIndex === 0} className="font-medium disabled:opacity-30">
                Prev post
              </button>
              <button onClick={goNextPost} disabled={postIndex === posts.length - 1} className="font-medium disabled:opacity-30">
                Next post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
