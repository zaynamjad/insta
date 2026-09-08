/**
 * Renders an actual flag image rather than a Unicode flag emoji — many
 * platforms (Windows Chrome/Edge chief among them) have no glyph for
 * regional-indicator flag emoji and silently fall back to showing the
 * raw two-letter code instead of a flag.
 */
export function FlagIcon({
  countryCode,
  className = "h-[15px] w-5 rounded-[2px] object-cover",
}: {
  countryCode: string;
  className?: string;
}) {
  const cc = countryCode.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/24x18/${cc}.png`}
      srcSet={`https://flagcdn.com/48x36/${cc}.png 2x`}
      width={20}
      height={15}
      alt=""
      aria-hidden
      className={className}
    />
  );
}
