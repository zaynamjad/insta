import { notFound, redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { getRegistryEntry, segmentsToPath } from "@/lib/admin/page-registry";
import { getPageSettingsSafe, isSettingsStoreConfigured } from "@/lib/admin/settings-store";
import { DEFAULT_PAGE_SEO_SETTINGS } from "@/types/page-settings";
import { AdminEditor } from "@/components/admin/AdminEditor";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

interface Props {
  params: Promise<{ path: string[] }>;
}

/**
 * Lives under the static `seo-editor-internal` segment rather than directly
 * at the app root, because a bare `[...path]` catch-all can't be a sibling
 * of the `[locale]` segment the rest of the site now lives under — Next.js
 * requires every dynamic segment at a given tree position to share the
 * same param name, and `locale` vs `path` don't. (A leading-underscore name
 * like `_admin-edit` would dodge that conflict too, but Next.js treats any
 * leading-underscore folder as a private folder excluded from routing
 * entirely, which silently drops the route instead.) `proxy.ts` rewrites
 * `<any known page>/admin-edit/` requests here internally (after its own
 * auth check) while leaving the visible URL unchanged, so this still only
 * ever handles that one shape of request; the `admin-edit` suffix check
 * below is a second, defense-in-depth confirmation of that.
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
