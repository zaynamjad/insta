"use client";

import { useState, useTransition } from "react";
import { SITE_URL, TWITTER_HANDLE } from "@/lib/site";
import type { PageSeoSettings } from "@/types/page-settings";
import { saveSettingsAction } from "@/app/[...path]/actions";
import { logoutAction } from "@/app/admin/login/actions";

type Tab = "seo" | "social" | "robots" | "schema" | "scripts" | "notes";

const TABS: { id: Tab; label: string }[] = [
  { id: "seo", label: "SEO" },
  { id: "social", label: "Social" },
  { id: "robots", label: "Robots" },
  { id: "schema", label: "Schema" },
  { id: "scripts", label: "Scripts" },
  { id: "notes", label: "Notes" },
];

export function AdminEditor({
  path,
  pageLabel,
  defaultTitle,
  defaultDescription,
  initialSettings,
  storeConfigured,
}: {
  path: string;
  pageLabel: string;
  defaultTitle: string;
  defaultDescription: string;
  initialSettings: PageSeoSettings;
  storeConfigured: boolean;
}) {
  const [tab, setTab] = useState<Tab>("seo");
  const [settings, setSettings] = useState<PageSeoSettings>(initialSettings);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function update<K extends keyof PageSeoSettings>(key: K, value: PageSeoSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    setResult(null);
    startTransition(async () => {
      const res = await saveSettingsAction(path, settings);
      setResult(res);
    });
  }

  const robotsPreview = buildRobotsPreview(settings);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            Editing page
          </p>
          <h1 className="text-xl font-bold text-foreground">{pageLabel}</h1>
          <p className="text-sm text-foreground/50">
            {SITE_URL}
            {path}
          </p>
        </div>
        <form action={logoutAction} className="shrink-0">
          <button
            type="submit"
            className="text-sm font-medium text-foreground/50 hover:text-foreground"
          >
            Log out
          </button>
        </form>
      </div>

      {!storeConfigured && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Storage isn&apos;t connected yet (Upstash Redis integration). You
          can edit fields below, but saving will fail until that&apos;s set up.
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "brand-gradient text-white"
                : "bg-surface-muted text-foreground/70 hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        {tab === "seo" && (
          <div className="space-y-5">
            <Field label="Meta Title" hint={`Placeholder: ${defaultTitle}`}>
              <TextInput
                value={settings.metaTitle}
                onChange={(v) => update("metaTitle", v)}
                placeholder={defaultTitle}
              />
            </Field>
            <Field label="Meta Description" hint={`Placeholder: ${defaultDescription}`}>
              <TextArea
                value={settings.metaDescription}
                onChange={(v) => update("metaDescription", v)}
                placeholder={defaultDescription}
              />
            </Field>
            <Field
              label="Meta Keywords"
              hint="Comma-separated. Modern search engines mostly ignore this tag, but it's included for completeness."
            >
              <TextInput
                value={settings.metaKeywords}
                onChange={(v) => update("metaKeywords", v)}
                placeholder="keyword one, keyword two"
              />
            </Field>
            <Field label="Canonical Link">
              <div className="flex items-center gap-4">
                <RadioGroup
                  value={settings.canonicalMode}
                  onChange={(v) => update("canonicalMode", v as PageSeoSettings["canonicalMode"])}
                  options={[
                    { value: "auto", label: "Auto-generate" },
                    { value: "custom", label: "Custom URL" },
                  ]}
                />
              </div>
              {settings.canonicalMode === "custom" && (
                <div className="mt-2">
                  <TextInput
                    value={settings.canonicalUrl}
                    onChange={(v) => update("canonicalUrl", v)}
                    placeholder={`${SITE_URL}${path}`}
                  />
                </div>
              )}
            </Field>
          </div>
        )}

        {tab === "social" && (
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-5">
              <h2 className="font-semibold text-foreground">Open Graph &amp; Twitter</h2>
              <Field label="Social Title (og:title, twitter:title)">
                <CheckboxRow
                  checked={settings.useSeoTitleForSocial}
                  onChange={(v) => update("useSeoTitleForSocial", v)}
                  label="Use Title from SEO"
                />
                {!settings.useSeoTitleForSocial && (
                  <TextInput
                    value={settings.socialTitle}
                    onChange={(v) => update("socialTitle", v)}
                    placeholder={settings.metaTitle || defaultTitle}
                  />
                )}
              </Field>
              <Field label="Social Description (og:description, twitter:description)">
                <CheckboxRow
                  checked={settings.useSeoDescriptionForSocial}
                  onChange={(v) => update("useSeoDescriptionForSocial", v)}
                  label="Use Description from SEO"
                />
                {!settings.useSeoDescriptionForSocial && (
                  <TextArea
                    value={settings.socialDescription}
                    onChange={(v) => update("socialDescription", v)}
                    placeholder={settings.metaDescription || defaultDescription}
                  />
                )}
              </Field>
              <Field label="Social Image">
                <CheckboxRow
                  checked={settings.useDefaultImageForSocial}
                  onChange={(v) => update("useDefaultImageForSocial", v)}
                  label="Use default site image"
                />
                {!settings.useDefaultImageForSocial && (
                  <TextInput
                    value={settings.socialImageUrl}
                    onChange={(v) => update("socialImageUrl", v)}
                    placeholder="https://…"
                  />
                )}
              </Field>
            </div>
            <div className="space-y-5">
              <h2 className="font-semibold text-foreground">Twitter</h2>
              <Field label="Twitter Site (twitter:site)">
                <TextInput
                  value={settings.twitterSite}
                  onChange={(v) => update("twitterSite", v)}
                  placeholder={TWITTER_HANDLE}
                />
              </Field>
              <Field label="Twitter Creator (twitter:creator)">
                <TextInput
                  value={settings.twitterCreator}
                  onChange={(v) => update("twitterCreator", v)}
                  placeholder={TWITTER_HANDLE}
                />
              </Field>
            </div>
          </div>
        )}

        {tab === "robots" && (
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-5">
              <Field label="Index Behavior">
                <Select
                  value={settings.robotsIndex}
                  onChange={(v) => update("robotsIndex", v as PageSeoSettings["robotsIndex"])}
                  options={[
                    { value: "index", label: "Index" },
                    { value: "noindex", label: "No Index" },
                  ]}
                />
              </Field>
              <Field label="Follow Behavior">
                <Select
                  value={settings.robotsFollow}
                  onChange={(v) => update("robotsFollow", v as PageSeoSettings["robotsFollow"])}
                  options={[
                    { value: "follow", label: "Follow" },
                    { value: "nofollow", label: "No Follow" },
                  ]}
                />
              </Field>
              <Field label="Preview">
                <code className="block rounded-lg bg-surface-muted p-3 text-xs text-foreground/70">
                  {robotsPreview}
                </code>
              </Field>
            </div>
            <div className="space-y-3">
              <h2 className="font-semibold text-foreground">Optional Settings</h2>
              <ToggleRow
                checked={settings.robotsNoImageIndex}
                onChange={(v) => update("robotsNoImageIndex", v)}
                label="Prevent images on this page from being indexed"
              />
              <ToggleRow
                checked={settings.robotsNoArchive}
                onChange={(v) => update("robotsNoArchive", v)}
                label="Prevent a cached link in search results"
              />
              <ToggleRow
                checked={settings.robotsNoSnippet}
                onChange={(v) => update("robotsNoSnippet", v)}
                label="Prevent a text snippet in search results"
              />
              <ToggleRow
                checked={settings.robotsNoTranslate}
                onChange={(v) => update("robotsNoTranslate", v)}
                label="Prevent offering translation of this page"
              />
            </div>
          </div>
        )}

        {tab === "schema" && (
          <div className="space-y-3">
            <Field
              label="Custom JSON-LD"
              hint="Added alongside this page's built-in schema (WebSite, Organization, etc.), not a replacement for it. Must be valid JSON."
            >
              <TextArea
                value={settings.schemaJsonLd}
                onChange={(v) => update("schemaJsonLd", v)}
                placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "Thing"\n}'}
                rows={12}
                mono
              />
            </Field>
          </div>
        )}

        {tab === "scripts" && (
          <div className="space-y-3">
            <Field
              label="Header Scripts"
              hint="Paste <script>…</script> and/or <style>…</style> blocks. This is admin-authored, trusted content, injected as-is: never paste anything you don't control."
            >
              <TextArea
                value={settings.headerScripts}
                onChange={(v) => update("headerScripts", v)}
                placeholder="<script>\n  // …\n</script>"
                rows={12}
                mono
              />
            </Field>
            <ToggleRow
              checked={settings.disableHeaderScripts}
              onChange={(v) => update("disableHeaderScripts", v)}
              label="Disable header scripts on this page (keeps the saved content, just stops rendering it)"
            />
          </div>
        )}

        {tab === "notes" && (
          <div className="space-y-3">
            <Field label="Notes" hint="Internal reference only. Never shown on the public page.">
              <TextArea
                value={settings.notes}
                onChange={(v) => update("notes", v)}
                placeholder="Anything worth remembering about this page…"
                rows={8}
              />
            </Field>
          </div>
        )}
      </div>

      <div className="sticky bottom-4 mt-6 flex items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-lg">
        <div className="text-sm">
          {result && (
            <span className={result.ok ? "text-green-600" : "font-medium text-red-600"}>
              {result.message}
            </span>
          )}
          {!result && settings.updatedAt && (
            <span className="text-foreground/50">
              Last saved {new Date(settings.updatedAt).toLocaleString()}
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={pending}
          className="brand-gradient rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function buildRobotsPreview(settings: PageSeoSettings): string {
  const directives: string[] = [settings.robotsIndex, settings.robotsFollow];
  if (settings.robotsNoImageIndex) directives.push("noimageindex");
  if (settings.robotsNoArchive) directives.push("noarchive");
  if (settings.robotsNoSnippet) directives.push("nosnippet");
  if (settings.robotsNoTranslate) directives.push("notranslate");
  return `<meta name="robots" content="${directives.join(",")}"/>`;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-foreground/80">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-foreground/45">{hint}</p>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-4"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-4 ${mono ? "font-mono text-xs" : ""}`}
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-4"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function RadioGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="mt-1.5 flex gap-4">
      {options.map((o) => (
        <label key={o.value} className="flex items-center gap-1.5 text-sm text-foreground/75">
          <input
            type="radio"
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="accent-accent"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="mt-1.5 flex items-center gap-2 text-xs text-foreground/60">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-accent"
      />
      {label}
    </label>
  );
}

function ToggleRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground/75">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-accent"
      />
      {label}
    </label>
  );
}
