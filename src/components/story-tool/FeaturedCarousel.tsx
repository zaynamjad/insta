"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { FeaturedProfile } from "@/lib/story/featured-profiles";
import { SEARCH_USERNAME_EVENT } from "./StoryTool";

function triggerSearch(username: string) {
  document.getElementById("search")?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.dispatchEvent(new CustomEvent(SEARCH_USERNAME_EVENT, { detail: username }));
}

/**
 * Fetches `/api/featured-profiles` on mount instead of receiving data
 * server-rendered — that used to run during Next.js static generation,
 * meaning every build/deploy spent HikerAPI credits with no real visitor
 * involved. Fetching client-side ties the (still 12h-cached) HikerAPI
 * call to actual page loads only. Renders the list twice back-to-back
 * with a CSS transform loop (`animate-marquee`), so the seam between the
 * end and the restart is invisible — no gap, no pause.
 */
export function FeaturedCarousel() {
  const [profiles, setProfiles] = useState<FeaturedProfile[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/featured-profiles")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { profiles?: FeaturedProfile[] } | null) => {
        if (!cancelled && data?.profiles) setProfiles(data.profiles);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  if (!profiles) return <CarouselSkeleton />;

  const track = [...profiles, ...profiles];

  return (
    <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_5%,black_95%,transparent)]">
      <div className="flex w-max gap-8 py-2 animate-marquee">
        {track.map((item, i) => {
          const name = item.profile?.fullName ?? item.meta.displayName;
          const avatar = item.profile?.profileImage;
          const followers =
            item.profile?.followers != null ? formatCount(item.profile.followers) : item.meta.fallbackFollowers;

          return (
            <button
              key={`${item.meta.username}-${i}`}
              onClick={() => triggerSearch(item.meta.username)}
              aria-label={`View ${item.meta.displayName}'s public profile`}
              className="flex w-36 shrink-0 flex-col items-center gap-2.5 text-center"
            >
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full brand-gradient p-[3px]">
                <div className="h-full w-full overflow-hidden rounded-full bg-surface">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt=""
                      width={96}
                      height={96}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-foreground/40">
                      {item.meta.displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <p className="w-full truncate text-sm font-semibold text-foreground">{name}</p>
              <p className="text-xs text-foreground/50">{followers} followers</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

function CarouselSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl gap-6 overflow-hidden px-4 sm:px-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex w-28 shrink-0 flex-col items-center gap-2">
          <div className="animate-skeleton h-16 w-16 rounded-full bg-surface-muted" />
          <div className="animate-skeleton h-3 w-16 rounded bg-surface-muted" />
        </div>
      ))}
    </div>
  );
}
