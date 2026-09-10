"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { HighlightItemsLookupResult } from "@/types/highlight";
import { errorMessageKey } from "@/lib/story/error-messages";
import { DownloadButton } from "./DownloadButton";

/** Shown below the search box when the input was a pasted Highlight link rather than a username. */
export function SingleHighlightResult({
  result,
  onReset,
}: {
  result: HighlightItemsLookupResult;
  onReset: () => void;
}) {
  const t = useTranslations("StoryTool");
  const [itemIndex, setItemIndex] = useState(0);

  if (result.status === "error") {
    return <ErrorCard onReset={onReset}>{t(errorMessageKey(result.code))}</ErrorCard>;
  }

  if (result.status === "not_found") {
    return <ErrorCard onReset={onReset}>{t("highlightNotFound")}</ErrorCard>;
  }

  const { title, items } = result;
  const item = items[Math.min(itemIndex, items.length - 1)];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        {title && <p className="truncate text-sm font-semibold text-foreground/80">{title}</p>}
        <button
          onClick={onReset}
          className="shrink-0 text-sm font-medium text-foreground/50 hover:text-foreground"
        >
          {t("searchAnother")}
        </button>
      </div>

      <div className="mx-auto mt-3 max-w-sm">
        <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-surface-muted">
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

          {items.length > 1 && (
            <>
              <button
                aria-label={t("previousItem")}
                disabled={itemIndex === 0}
                onClick={() => setItemIndex((i) => Math.max(0, i - 1))}
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white disabled:opacity-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button
                aria-label={t("nextItem")}
                disabled={itemIndex === items.length - 1}
                onClick={() => setItemIndex((i) => Math.min(items.length - 1, i + 1))}
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white disabled:opacity-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
              <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
                {items.map((_, i) => (
                  <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === itemIndex ? "bg-white" : "bg-white/40"}`} />
                ))}
              </div>
            </>
          )}
        </div>

        {item && (
          <DownloadButton
            mediaUrl={item.mediaUrl}
            label={t("download")}
            showLabel
            className="brand-gradient mt-4 flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          />
        )}
      </div>
    </div>
  );
}

function ErrorCard({ children, onReset }: { children: React.ReactNode; onReset: () => void }) {
  const t = useTranslations("StoryTool");
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <p className="text-sm leading-relaxed text-foreground/75">{children}</p>
      <button onClick={onReset} className="mt-4 text-sm font-semibold text-accent hover:underline">
        {t("searchAnother")}
      </button>
    </div>
  );
}
