import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="brand-gradient-text text-7xl font-extrabold tracking-tight">
        404
      </span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 text-foreground/65">
        The page you&apos;re looking for doesn&apos;t exist or may have
        moved. Try the Instagram Story Viewer instead.
      </p>
      <Link
        href="/instagram-story-viewer/"
        className="brand-gradient mt-6 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
      >
        Open the Story Viewer
      </Link>
      <Link
        href="/"
        className="mt-4 text-sm font-medium text-foreground/55 hover:text-foreground"
      >
        Back to homepage
      </Link>
    </div>
  );
}
