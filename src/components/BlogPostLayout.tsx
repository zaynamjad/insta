import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { PageOverridesRenderer } from "@/components/admin/PageOverridesRenderer";
import { articleSchema } from "@/lib/seo/schema";

export function BlogPostLayout({
  title,
  description,
  path,
  datePublished,
  readingTime,
  children,
}: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  readingTime: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd
        data={articleSchema({
          headline: title,
          description,
          path,
          datePublished,
        })}
      />
      <PageOverridesRenderer path={path} />
      <Breadcrumbs items={[{ name: "Guides", path: "/blog/" }, { name: title, path }]} />

      <header className="mt-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-foreground/50">
          Published{" "}
          <time dateTime={datePublished}>
            {new Date(datePublished).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>{" "}
          · {readingTime} read
        </p>
      </header>

      <div className="prose-content mt-8 space-y-5 text-base leading-relaxed text-foreground/80 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_strong]:text-foreground [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-surface-muted [&_th]:p-2.5 [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:p-2.5">
        {children}
      </div>

      <div className="mt-12 rounded-2xl border border-border bg-surface-muted p-6 text-center">
        <p className="font-semibold text-foreground">
          Ready to try the Instagram Story Viewer?
        </p>
        <p className="mt-1 text-sm text-foreground/65">
          Enter a public username and view their current Stories — no login required.
        </p>
        <Link
          href="/instagram-story-viewer/"
          className="brand-gradient mt-4 inline-block rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
        >
          Open the Story Viewer
        </Link>
      </div>
    </article>
  );
}
