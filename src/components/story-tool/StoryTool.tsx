"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { validateUsername } from "@/lib/story/validation";
import type { StoryLookupResult } from "@/types/story";
import type { Profile } from "@/types/profile";
import { StoryViewerModal } from "./StoryViewerModal";

type Status = "idle" | "loading" | "result";

export function StoryTool({
  variant = "hero",
}: {
  variant?: "hero" | "compact";
}) {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<StoryLookupResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const { valid, normalized, error } = validateUsername(input);
    if (!valid) {
      setFormError(error ?? "Enter a valid Instagram username.");
      return;
    }

    setStatus("loading");
    setResult(null);

    try {
      const res = await fetch("/api/story-viewer/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalized }),
      });
      const data: StoryLookupResult = await res.json();
      setResult(data);
      setStatus("result");
    } catch {
      setResult({
        status: "error",
        code: "UPSTREAM_ERROR",
        message: "We couldn't retrieve public content right now. Please try again later.",
      });
      setStatus("result");
    }
  }

  function reset() {
    setStatus("idle");
    setResult(null);
    setInput("");
    setFormError(null);
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

      {formError && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {formError}
        </p>
      )}

      <p className="mt-3 text-xs text-foreground/50">
        Public profiles only. We never ask for your Instagram password.
      </p>

      <div className="mt-6">
        {status === "loading" && <LoadingState />}
        {status === "result" && result && (
          <ResultState
            result={result}
            variant={variant}
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

function LoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-border bg-surface p-6"
    >
      <p className="text-sm font-medium text-foreground/70">
        Finding publicly available stories…
      </p>
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
  onReset,
  onOpenViewer,
}: {
  result: StoryLookupResult;
  variant: "hero" | "compact";
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

  if (result.status === "no_stories") {
    return (
      <StateCard tone="neutral" onReset={onReset} profile={result.profile}>
        No publicly available stories found for this username.{" "}
        <Link
          href={`/profile/${result.profile.username}/`}
          className="font-semibold text-accent hover:underline"
        >
          View public profile info
        </Link>
        .
      </StateCard>
    );
  }

  // status === "ok"
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <ProfileHeader profile={result.profile} storyCount={result.profile.stories.length} />
        <button
          onClick={onReset}
          className="shrink-0 text-xs font-medium text-foreground/50 hover:text-foreground"
        >
          Search another
        </button>
      </div>

      <div
        className={`mt-5 grid gap-3 ${
          variant === "hero"
            ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6"
            : "grid-cols-4 sm:grid-cols-6"
        }`}
      >
        {result.profile.stories.map((story, index) => (
          <button
            key={story.id}
            onClick={() => onOpenViewer(index)}
            className="group relative aspect-[9/16] overflow-hidden rounded-xl border border-border bg-surface-muted"
            aria-label={`Open story ${index + 1}`}
          >
            {story.thumbnailUrl && (
              // Provider thumbnails are untrusted remote URLs at arbitrary sizes.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={story.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
            <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileHeader({
  profile,
  storyCount,
}: {
  profile: Pick<Profile, "username" | "fullName" | "profileImage">;
  storyCount?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full brand-gradient p-[2px]">
        <div className="h-full w-full overflow-hidden rounded-full bg-surface">
          {profile.profileImage ? (
            <Image
              src={profile.profileImage}
              alt={profile.username}
              width={48}
              height={48}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-foreground/40">
              {profile.username.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>
      <div>
        <p className="font-semibold text-foreground">
          {profile.fullName ?? `@${profile.username}`}
        </p>
        <p className="text-xs text-foreground/50">
          @{profile.username}
          {typeof storyCount === "number" &&
            ` · ${storyCount} ${storyCount === 1 ? "story" : "stories"}`}
        </p>
      </div>
    </div>
  );
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
  profile?: Pick<Profile, "username" | "fullName" | "profileImage">;
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
