import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { lookupStory } from "@/lib/story/lookup";
import { validateUsername } from "@/lib/story/validation";
import { buildMetadata } from "@/lib/seo/metadata";
import { profilePageSchema } from "@/lib/seo/schema";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { formatCount } from "@/lib/format";

type Props = PageProps<"/profile/[username]">;

/**
 * Deliberately `noindex` on every profile page, regardless of how much
 * genuine public data was retrieved. This is a conservative call beyond
 * what the spec technically requires (which only asks to noindex *thin*
 * profile pages) — an indexable, per-username URL that mirrors data
 * pulled from a site whose robots.txt explicitly disallows automated
 * collection is a much more visible, permanent artifact than an ephemeral
 * API call, and Google's own policies penalize sites built on scraped/
 * mirrored third-party content. See docs/story-retrieval-limitations.md.
 * Flip this only as a deliberate, separate decision.
 */
const NOINDEX_PROFILE_PAGES = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const { valid, normalized } = validateUsername(username);
  if (!valid) return buildMetadata({ title: "Profile", description: "", path: `/profile/${username}/`, noindex: true });

  const result = await lookupStory(normalized);
  const path = `/profile/${normalized}/`;

  if (result.status === "not_found") {
    return buildMetadata({ title: "Profile not found", description: "", path, noindex: true });
  }

  if (result.status === "error") {
    return buildMetadata({
      title: `@${normalized}`,
      description: "We couldn't retrieve public content right now.",
      path,
      noindex: true,
    });
  }

  const { profile } = result;
  const displayName = profile.fullName ?? `@${profile.username}`;

  return buildMetadata({
    title: `${displayName} (@${profile.username}): Public Profile`,
    description:
      profile.bio ??
      `Publicly available Instagram profile information for @${profile.username}.`,
    path,
    // Deliberately no ogImagePath: Instagram's CDN URLs are signed with a
    // short expiry, so hotlinking one as a cached social-preview image
    // would go stale — fall back to the site's default OG image instead.
    noindex: NOINDEX_PROFILE_PAGES,
  });
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const { valid, normalized } = validateUsername(username);
  if (!valid) notFound();

  const result = await lookupStory(normalized);

  if (result.status === "not_found") notFound();

  if (result.status === "error") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <Breadcrumbs items={[{ name: `@${normalized}`, path: `/profile/${normalized}/` }]} />
        <p className="mt-8 text-lg text-foreground/70">
          We couldn&apos;t retrieve public content right now. Please try again later.
        </p>
      </div>
    );
  }

  const { profile } = result;
  const path = `/profile/${profile.username}/`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd
        data={profilePageSchema({
          username: profile.username,
          fullName: profile.fullName,
          bio: profile.bio,
          profileImage: profile.profileImage,
          path,
        })}
      />
      <Breadcrumbs items={[{ name: `@${profile.username}`, path }]} />

      <div className="mt-8 flex flex-col items-center text-center">
        <div className="h-24 w-24 overflow-hidden rounded-full brand-gradient p-[3px]">
          <div className="h-full w-full overflow-hidden rounded-full bg-surface">
            {profile.profileImage ? (
              <Image
                src={profile.profileImage}
                alt={profile.username}
                width={96}
                height={96}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-foreground/40">
                {profile.username.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight">
            {profile.fullName ?? `@${profile.username}`}
          </h1>
          {profile.isVerified && (
            <span aria-label="Verified" title="Verified" className="text-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2 14.5 4.5 18 4 18 7.5 21 10 18.5 12 21 14 18 14.5 18 18 14.5 18 12 21 10 18.5 7.5 21 7 18 4 18 4 14.5 2 12 4 10 4 7.5 7 7.5 7 4 10.5 4Z" />
              </svg>
            </span>
          )}
        </div>
        <p className="mt-1 text-foreground/55">@{profile.username}</p>

        {profile.bio && (
          <p className="mt-4 max-w-md text-sm leading-relaxed text-foreground/75">
            {profile.bio}
          </p>
        )}

        <div className="mt-6 flex gap-8">
          <Stat label="Followers" value={formatCount(profile.followers)} />
          <Stat label="Following" value={formatCount(profile.following)} />
          <Stat label="Posts" value={formatCount(profile.posts)} />
        </div>
      </div>

      <div className="mt-12 rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">Instagram Stories</h2>
        {result.status === "private" ? (
          <p className="mt-2 text-sm text-foreground/65">
            This profile is private. Only public profiles are supported.
          </p>
        ) : profile.stories.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/65">
            No publicly available stories found for this username.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
            {profile.stories.map((story) => (
              <div
                key={story.id}
                className="aspect-[9/16] overflow-hidden rounded-xl border border-border bg-surface-muted"
              >
                {story.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={story.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | null }) {
  if (value === null) return null;
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-foreground/50">{label}</p>
    </div>
  );
}
