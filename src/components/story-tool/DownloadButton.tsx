export function DownloadButton({
  mediaUrl,
  className,
  label = "Download",
  showLabel = false,
}: {
  mediaUrl: string;
  className?: string;
  label?: string;
  /** Renders `label` as visible text next to the icon, instead of icon-only. */
  showLabel?: boolean;
}) {
  return (
    <a
      href={`/api/download?url=${encodeURIComponent(mediaUrl)}`}
      className={className}
      aria-label={showLabel ? undefined : label}
      onClick={(e) => e.stopPropagation()}
    >
      <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12m0 0-4-4m4 4 4-4M4 19h16" />
      </svg>
      {showLabel && label}
    </a>
  );
}
