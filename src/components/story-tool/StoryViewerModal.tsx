"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Profile } from "@/types/profile";
import type { Story } from "@/types/story";
import { DownloadButton } from "./DownloadButton";

const SWIPE_CLOSE_THRESHOLD = 80;
const SWIPE_NAV_THRESHOLD = 50;

export function StoryViewerModal({
  profile,
  stories,
  initialIndex,
  onClose,
}: {
  profile: Pick<Profile, "username" | "profileImage">;
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i >= stories.length - 1) {
        onClose();
        return i;
      }
      return i + 1;
    });
  }, [stories.length, onClose]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

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
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, goNext, goPrev]);

  useEffect(() => {
    function onVisibilityChange() {
      setPaused(document.hidden);
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const current = stories[index];

  useEffect(() => {
    if (paused || current.type === "video") return;
    const timer = setTimeout(goNext, current.duration * 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, current.duration, current.type]);

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;

    if (dy > SWIPE_CLOSE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      onClose();
      return;
    }
    if (Math.abs(dx) > SWIPE_NAV_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Stories from @${profile.username}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-0 sm:p-6"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative flex h-full w-full max-w-md flex-col sm:h-[92vh] sm:rounded-2xl sm:overflow-hidden">
        <div className="absolute inset-x-0 top-0 z-20 flex gap-1.5 p-3">
          {stories.map((story, i) => (
            <div
              key={story.id}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
            >
              <div
                className="h-full origin-left bg-white"
                style={
                  i === index
                    ? {
                        animation: `progress-fill ${story.duration}s linear forwards`,
                        animationPlayState: paused ? "paused" : "running",
                      }
                    : { transform: `scaleX(${i < index ? 1 : 0})` }
                }
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-x-0 top-6 z-20 flex items-center justify-between px-4 pt-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 overflow-hidden rounded-full brand-gradient p-[1.5px]">
              <div className="h-full w-full overflow-hidden rounded-full bg-black">
                {profile.profileImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.profileImage}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>
            <span className="text-sm font-semibold text-white">
              @{profile.username}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <DownloadButton
              mediaUrl={current.mediaUrl}
              label="Download this story"
              className="rounded-full p-2 text-white/90 hover:bg-white/10"
            />
            <button
              ref={closeBtnRef}
              onClick={onClose}
              aria-label="Close story viewer"
              className="rounded-full p-2 text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="relative flex-1 select-none bg-black">
          {current.type === "video" ? (
            <video
              key={current.id}
              src={current.mediaUrl}
              className="h-full w-full object-contain"
              autoPlay
              playsInline
              muted
              onEnded={goNext}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={current.id}
              src={current.mediaUrl}
              alt={`Story from @${profile.username}`}
              className="h-full w-full object-contain"
            />
          )}

          <button
            aria-label="Previous story"
            onClick={goPrev}
            onMouseDown={(e) => e.preventDefault()}
            className="absolute left-0 top-0 h-full w-1/3 cursor-default"
          />
          <button
            aria-label="Next story"
            onClick={goNext}
            onMouseDown={(e) => e.preventDefault()}
            className="absolute right-0 top-0 h-full w-2/3 cursor-default"
          />
        </div>
      </div>
    </div>
  );
}
