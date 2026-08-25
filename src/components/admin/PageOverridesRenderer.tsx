import { getRenderOverrides } from "@/lib/admin/apply-overrides";
import { JsonLd } from "@/components/JsonLd";

/**
 * Renders an admin's custom JSON-LD and/or header scripts for one page.
 * Drop this anywhere in a page's tree (doesn't need to be literally inside
 * `<head>` — JSON-LD is valid anywhere in the document, and `<script>`
 * tags execute wherever they appear in server-rendered HTML).
 *
 * `headerScriptsHtml` only ever originates from an authenticated admin
 * save (see `lib/admin/actions.ts`), never from public input — that's
 * what makes rendering it as raw HTML here safe.
 */
export async function PageOverridesRenderer({ path }: { path: string }) {
  const { schemaJsonLd, headerScriptsHtml } = await getRenderOverrides(path);

  return (
    <>
      {schemaJsonLd && <JsonLd data={schemaJsonLd} />}
      {headerScriptsHtml && <RawScriptsAndStyles html={headerScriptsHtml} />}
    </>
  );
}

const SCRIPT_TAG = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const STYLE_TAG = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi;

function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrPattern = /([a-zA-Z-]+)(?:=["']([^"']*)["'])?/g;
  let match: RegExpExecArray | null;
  while ((match = attrPattern.exec(attrString))) {
    const [, name, value] = match;
    if (name.toLowerCase() === "type" && value && value !== "text/javascript") continue;
    attrs[name] = value ?? "";
  }
  return attrs;
}

function RawScriptsAndStyles({ html }: { html: string }) {
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const match of html.matchAll(SCRIPT_TAG)) {
    const [, attrString, content] = match;
    const attrs = parseAttributes(attrString);
    elements.push(
      <script key={`admin-script-${key++}`} {...attrs} dangerouslySetInnerHTML={{ __html: content }} />,
    );
  }

  for (const match of html.matchAll(STYLE_TAG)) {
    const [, , content] = match;
    elements.push(
      <style key={`admin-style-${key++}`} dangerouslySetInnerHTML={{ __html: content }} />,
    );
  }

  return <>{elements}</>;
}
