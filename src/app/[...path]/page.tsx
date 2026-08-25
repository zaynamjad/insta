import { notFound, redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { getRegistryEntry, segmentsToPath } from "@/lib/admin/page-registry";
import { getPageSettingsSafe, isSettingsStoreConfigured } from "@/lib/admin/settings-store";
import { DEFAULT_PAGE_SEO_SETTINGS } from "@/types/page-settings";
import { AdminEditor } from "@/components/admin/AdminEditor";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

type Props = PageProps<"/[...path]">;

/**
 * Catch-all for exactly one shape of URL: `<any known page>/admin-edit/`.
 * Everything else that reaches here (i.e. doesn't match a more specific
 * static/dynamic route elsewhere in `app/`) is a genuinely unmatched
 * route and 404s, same as before this route existed.
 *
 * This has to be a *required* catch-all rather than the more obvious
 * `[[...path]]/admin-edit/` nested route, because Next.js doesn't allow
 * a literal segment after a catch-all — so the "admin-edit" suffix is
 * checked here in code instead of in the file path.
 */
export default async function CatchAllPage({ params }: Props) {
  const { path: segments } = await params;
  const last = segments[segments.length - 1];

  if (last !== "admin-edit") {
    notFound();
  }

  const path = segmentsToPath(segments.slice(0, -1));

  // Defense in depth: proxy.ts already redirects unauthenticated visits
  // before this ever renders, but this page checks independently too.
  if (!(await isAdminAuthenticated())) {
    const editUrl = path === "/" ? "/admin-edit/" : `${path}admin-edit/`;
    redirect(`/admin/login/?redirect=${encodeURIComponent(editUrl)}`);
  }

  const entry = getRegistryEntry(path);

  if (!entry) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-xl font-bold text-foreground">Page not recognized</h1>
        <p className="mt-2 text-sm text-foreground/60">
          <code>{path}</code> isn&apos;t a page this editor knows about. Dynamic
          lookups like <code>/profile/[username]/</code> aren&apos;t editable
          this way, since they mirror live third-party data rather than
          authored content.
        </p>
      </div>
    );
  }

  const [existing, storeConfigured] = await Promise.all([
    getPageSettingsSafe(path),
    Promise.resolve(isSettingsStoreConfigured()),
  ]);

  return (
    <AdminEditor
      path={path}
      pageLabel={entry.label}
      defaultTitle={entry.defaultTitle}
      defaultDescription={entry.defaultDescription}
      initialSettings={existing ?? DEFAULT_PAGE_SEO_SETTINGS}
      storeConfigured={storeConfigured}
    />
  );
}
