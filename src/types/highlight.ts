import type { Story } from "./story";
import type { ProviderErrorCode } from "@/lib/story/provider";

/** One entry in a profile's highlight tray — cover + title only, no story items yet. */
export interface HighlightMeta {
  id: string;
  title: string;
  coverImageUrl: string | null;
  mediaCount: number | null;
}

export type HighlightsErrorCode =
  | ProviderErrorCode
  | "INVALID_USERNAME"
  | "INVALID_REQUEST"
  | "NOT_SUPPORTED";

/** The tray for a username — fetched lazily when the Highlights tab opens. */
export type HighlightsLookupResult =
  | { status: "ok"; highlights: HighlightMeta[] }
  | { status: "not_found"; username: string }
  | { status: "private"; username: string }
  | { status: "error"; code: HighlightsErrorCode; message: string };

/** One highlight's actual story items — fetched on click (tray) or from a pasted highlight link. */
export type HighlightItemsLookupResult =
  | { status: "ok"; title: string; coverImageUrl: string | null; items: Story[] }
  | { status: "not_found" }
  | { status: "error"; code: HighlightsErrorCode; message: string };
