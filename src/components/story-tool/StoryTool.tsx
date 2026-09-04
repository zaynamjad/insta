"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { validateUsername } from "@/lib/story/validation";
import type { StoryLookupResult } from "@/types/story";
import type { Profile } from "@/types/profile";
import { StoryViewerModal } from "./StoryViewerModal";
import { PostsGrid } from "./PostsGrid";
import { DownloadButton } from "./DownloadButton";
import { Turnstile, type TurnstileHandle } from "./Turnstile";

type Status = "idle" | "loading" | "result";
type Tab = "stories" | "posts";
type LoadingPhase = "verifying" | "searching";

const TURNSTILE_ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
const MIN_LOADING_MS = 900; // avoids a jarring instant flash on a fast response

export function StoryTool({
  variant = "hero",
}: {
  variant?: "hero" | "compact";
}) {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("verifying");
  const [result, setResult] = useState<StoryLookupResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("stories");
  const turnstileRef = useRef<TurnstileHandle>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const { valid, normalized, error } = validateUsername(input);
    if (!valid) {
      setFormError(error ?? "Enter a valid Instagram username.");
      return;
    }

    // Show the loading state immediately — verification and the actual
    // lookup both happen while it's visible, so the user isn't staring at
    // an unchanged form during either real step.
    const startedAt = Date.now();
    setStatus("loading");
    setLoadingPhase("verifying");
    setResult(null);
    setTab("stories");

    let data: StoryLookupResult;
    try {
      const turnstileToken = TURNSTILE_ENABLED ? await turnstileRef.current?.getToken() : null;
      setLoadingPhase("searching");
      const res = await fetch("/api/story-viewer/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalized, turnstileToken }),
      });
      data = await res.json();
    } catch {
      data = {
        status: "error",
        code: "UPSTREAM_ERROR",
        message: "We couldn't retrieve public content right now. Please try again later.",
      };
    }

    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_LOADING_MS) {
      await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
    }

    setResult(data);
    setStatus("result");
  }

  function reset() {
    setStatus("idle");
    setResult(null);
    setInput("");
    setFormError(null);
    setTab("stories");
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row"
        aria-label="Search Instagram stories by username"
      >
        <div className="relative flex-1">
          <span
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40"
          >
            @
          </span>
          <input
            type="text"
            inputMode="text"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter Instagram username"
            aria-label="Instagram username"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-4 pl-8 text-base text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-4"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="brand-gradient shrink-0 rounded-2xl px-8 py-4 text-base font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "loading" ? "Searching…" : "View Stories"}
        </button>
      </form>

      {TURNSTILE_ENABLED && <Turnstile ref={turnstileRef} />}

      {formError && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {formError}
        </p>
      )}

      <p className="mt-3 text-xs text-foreground/50">
        Public profiles only. We never ask for your Instagram password.
      </p>

      <div className="mt-6">
        {status === "loading" && <LoadingState phase={loadingPhase} />}
        {status === "result" && result && (
          <ResultState
            result={result}
            variant={variant}
            tab={tab}
            onTabChange={setTab}
            onReset={reset}
            onOpenViewer={(index) => setViewerIndex(index)}
          />
        )}
      </div>

      {result?.status === "ok" && viewerIndex !== null && (
        <StoryViewerModal
          profile={result.profile}
          stories={result.profile.stories}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}

function LoadingState({ phase }: { phase: LoadingPhase }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-border bg-surface p-6"
    >
      <div className="flex items-center gap-2.5">
        <svg
          aria-hidden
          className="h-4 w-4 shrink-0 animate-spin text-accent"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
        </svg>
        <p className="text-sm font-medium text-foreground/70">
          {phase === "verifying" ? "Verifying your request…" : "Searching for public stories…"}
        </p>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="animate-skeleton h-14 w-14 shrink-0 rounded-full bg-surface-muted" />
        <div className="flex-1 space-y-2">
          <div className="animate-skeleton h-3 w-1/3 rounded bg-surface-muted" />
          <div className="animate-skeleton h-3 w-1/4 rounded bg-surface-muted" />
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-skeleton h-24 w-16 shrink-0 rounded-xl bg-surface-muted sm:h-32 sm:w-20"
          />
        ))}
      </div>
    </div>
  );
}

function ResultState({
  result,
  variant,
  tab,
  onTabChange,
  onReset,
  onOpenViewer,
}: {
  result: StoryLookupResult;
  variant: "hero" | "compact";
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onReset: () => void;
  onOpenViewer: (index: number) => void;
}) {
  if (result.status === "error") {
    return (
      <StateCard tone="error" onReset={onReset}>
        {result.message}
      </StateCard>
    );
  }

  if (result.status === "not_found") {
    return (
      <StateCard tone="neutral" onReset={onReset}>
        We couldn&apos;t find this public profile.
      </StateCard>
    );
  }

  if (result.status === "private") {
    return (
      <StateCard tone="neutral" onReset={onReset} profile={result.profile}>
        This profile is private. Only public profiles are supported.
      </StateCard>
    );
  }

  // status === "ok" or "no_stories" — a confirmed public profile either way
  const profile = result.profile;

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

      <ProfileHeader profile={profile} />

      <div className="mt-5 flex gap-2 border-b border-border">
        <TabButton active={tab === "stories"} onClick={() => onTabChange("stories")}>
          Stories {result.status === "ok" ? `(${profile.stories.length})` : ""}
        </TabButton>
        <TabButton active={tab === "posts"} onClick={() => onTabChange("posts")}>
          Posts
        </TabButton>
      </div>

      {tab === "stories" ? (
        result.status === "no_stories" ? (
          <p className="mt-5 text-sm text-foreground/60">
            No publicly available stories found for this username.{" "}
            <Link
              href={`/profile/${profile.username}/`}
              className="font-semibold text-accent hover:underline"
            >
              View public profile info
            </Link>
            .
          </p>
        ) : (
          <div
            className={`mt-5 grid gap-3 ${
              variant === "hero"
                ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6"
                : "grid-cols-4 sm:grid-cols-6"
            }`}
          >
            {profile.stories.map((story, index) => (
              <div
                key={story.id}
                className="group relative aspect-[9/16] overflow-hidden rounded-xl border border-border bg-surface-muted"
              >
                <button
                  onClick={() => onOpenViewer(index)}
                  className="absolute inset-0 h-full w-full"
                  aria-label={`Open story ${index + 1}`}
                >
                  {story.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={story.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                </button>
                {/* Sibling, not nested inside the button above — an <a> inside a <button> is invalid HTML and misfires clicks. */}
                <DownloadButton
                  mediaUrl={story.mediaUrl}
                  label={`Download story ${index + 1}`}
                  className="absolute bottom-1.5 right-1.5 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                />
              </div>
            ))}
          </div>
        )
      ) : (
        <PostsGrid username={profile.username} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
        active
          ? "border-accent text-foreground"
          : "border-transparent text-foreground/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ProfileHeader({ profile }: { profile: Profile }) {
  return (
    <div>
      <div className="flex items-start gap-4 sm:gap-6">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full brand-gradient p-[3px] sm:h-24 sm:w-24">
          <div className="h-full w-full overflow-hidden rounded-full bg-surface p-[2px]">
            {profile.profileImage ? (
              <Image
                src={profile.profileImage}
                alt={profile.username}
                width={96}
                height={96}
                className="h-full w-full rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full text-lg font-semibold text-foreground/40">
                {profile.username.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-lg font-bold text-foreground sm:text-xl">
              {profile.fullName ?? `@${profile.username}`}
            </p>
            {profile.isVerified && (
              <svg aria-label="Verified" width="17" height="17" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-accent">
                <path d="M12 2l2.4 2.1 3.1-.5 1 3 2.8 1.5-.5 3.1L23 14l-2.2 2.4.5 3.1-2.8 1.5-1 3-3.1-.5L12 26l-2.4-2.1-3.1.5-1-3-2.8-1.5.5-3.1L1 14l2.2-2.4-.5-3.1 2.8-1.5 1-3 3.1.5z" />
              </svg>
            )}
          </div>
          <p className="text-sm text-foreground/50">@{profile.username}</p>

          <div className="mt-3 flex gap-5 sm:gap-8">
            <Stat count={profile.posts} label="posts" />
            <Stat count={profile.followers} label="followers" />
            <Stat count={profile.following} label="following" />
          </div>
        </div>
      </div>

      <div className="mt-4">
        {profile.category && (
          <p className="text-sm text-foreground/50">{profile.category}</p>
        )}
        {profile.bio && (
          <p className="mt-1 whitespace-pre-line text-base leading-relaxed text-foreground/80">
            {profile.bio}
          </p>
        )}
        {profile.externalUrl && (
          <a
            href={profile.externalUrl}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-base font-medium text-accent hover:underline"
          >
            <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {formatUrlForDisplay(profile.externalUrl)}
          </a>
        )}
      </div>
    </div>
  );
}

function Stat({ count, label }: { count: number | null; label: string }) {
  if (typeof count !== "number") return null;
  return (
    <div>
      <p className="text-base font-bold text-foreground sm:text-lg">{formatCount(count)}</p>
      <p className="text-sm text-foreground/50">{label}</p>
    </div>
  );
}

function formatUrlForDisplay(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

function StateCard({
  tone,
  children,
  onReset,
  profile,
}: {
  tone: "neutral" | "error";
  children: React.ReactNode;
  onReset: () => void;
  profile?: Profile;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        tone === "error"
          ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30"
          : "border-border bg-surface"
      }`}
    >
      {profile && (
        <div className="mb-4">
          <ProfileHeader profile={profile} />
        </div>
      )}
      <p className="text-sm leading-relaxed text-foreground/75">{children}</p>
      <button
        onClick={onReset}
        className="mt-4 text-sm font-semibold text-accent hover:underline"
      >
        Search another username
      </button>
    </div>
  );
}
