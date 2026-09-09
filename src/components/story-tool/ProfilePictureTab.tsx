"use client";

import { useTranslations } from "next-intl";
import type { Profile } from "@/types/profile";
import { DownloadButton } from "./DownloadButton";

/**
 * No fetch of its own — the profile picture (and its HD variant, when the
 * provider exposes one) is already part of the profile fetched for the
 * Stories tab, so this tab is free to show.
 */
export function ProfilePictureTab({ profile }: { profile: Profile }) {
  const t = useTranslations("StoryTool");
  const image = profile.profileImageHd ?? profile.profileImage;

  if (!image) {
    return <p className="mt-5 text-sm text-foreground/60">{t("noProfilePicture")}</p>;
  }

  return (
    <div className="mx-auto mt-5 max-w-xs">
      <div className="relative aspect-square overflow-hidden rounded-full border border-border bg-surface-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={profile.username} className="h-full w-full object-cover" />
      </div>
      <DownloadButton
        mediaUrl={image}
        label={t("downloadProfilePicture")}
        showLabel
        className="brand-gradient mt-5 flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
      />
    </div>
  );
}
