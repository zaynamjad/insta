"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { HighlightsLookupResult, HighlightMeta, HighlightItemsLookupResult } from "@/types/highlight";
import type { Story } from "@/types/story";
import { errorMessageKey } from "@/lib/story/error-messages";
import { StoryViewerModal } from "./StoryViewerModal";

/**
 * Self-contained Highlights tab: fetches the tray (cover + title per
 * highlight) lazily on mount, then fetches one highlight's actual story
 * items only when it's clicked — mirrors `PostsGrid`'s lazy-fetch pattern,
 * but adds a second, per-click fetch since the tray call intentionally
 * doesn't include items (see `hikerapi-provider.ts`).
 */
export function HighlightsGrid({ username }: { username: string }) {
  const t = useTranslations("StoryTool");
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const [highlights, setHighlights] = useState<HighlightMeta[]>([]);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ title: string; coverImageUrl: string | null; items: Story[] } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");
      try {
        const res = await fetch("/api/highlights-viewer/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        const data: HighlightsLookupResult = await res.json();
        if (cancelled) return;

        if (data.status === "ok") {
          setHighlights(data.highlights);
          setState("loaded");
        } else if (data.status === "not_found" || data.status === "private") {
          setHighlights([]);
          setState("loaded");
        } else {
          setErrorKey(errorMessageKey(data.code));
          setState("error");
        }
      } catch {
        if (!cancelled) {
          setErrorKey("highlightsNetworkError");
          setState("error");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [username]);

  async function openHighlight(h: HighlightMeta) {
    setOpeningId(h.id);
    try {
      const res = await fetch("/api/highlight-viewer/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: `https://www.instagram.com/stories/highlights/${h.id}/` }),
      });
      const data: HighlightItemsLookupResult = await res.json();
      if (data.status === "ok" && data.items.length > 0) {
        setViewer({ title: data.title || h.title, coverImageUrl: data.coverImageUrl ?? h.coverImageUrl, items: data.items });
      }
    } finally {
      setOpeningId(null);
    }
  }

  if (state === "loading") {
    return (
      <div className="mt-5 flex gap-4 overflow-x-auto pb-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex shrink-0 flex-col items-center gap-1.5">
            <div className="animate-skeleton h-16 w-16 rounded-full bg-surface-muted" />
            <div className="animate-skeleton h-2.5 w-12 rounded bg-surface-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (state === "error") {
    return <p className="mt-5 text-sm text-foreground/60">{errorKey ? t(errorKey) : null}</p>;
  }

  if (highlights.length === 0) {
    return <p className="mt-5 text-sm text-foreground/60">{t("noPublicHighlights")}</p>;
  }

  return (
    <>
      <div className="mt-5 flex gap-4 overflow-x-auto pb-1">
        {highlights.map((h) => (
          <button
            key={h.id}
            onClick={() => openHighlight(h)}
            disabled={openingId !== null}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center disabled:opacity-60"
            aria-label={t("openHighlight", { title: h.title })}
          >
            <span className="relative h-16 w-16 overflow-hidden rounded-full border border-border bg-surface-muted">
              {h.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={h.coverImageUrl} alt="" className="h-full w-full object-cover" />
              )}
              {openingId === h.id && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <svg aria-hidden className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
                  </svg>
                </span>
              )}
            </span>
            <span className="w-full truncate text-xs text-foreground/70">{h.title}</span>
          </button>
        ))}
      </div>

      {viewer && (
        <StoryViewerModal
          profile={{ username: viewer.title, profileImage: viewer.coverImageUrl }}
          stories={viewer.items}
          initialIndex={0}
          onClose={() => setViewer(null)}
        />
      )}
    </>
  );
}
