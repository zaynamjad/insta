import type { Metadata } from "next";
import { loginAction } from "./actions";

export const metadata: Metadata = { title: "Admin Login", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Props = PageProps<"/admin/login">;

export default async function AdminLoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const redirectTo = typeof params.redirect === "string" ? params.redirect : "/";
  const hasError = params.error === "1";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16">
      <h1 className="text-xl font-bold text-foreground">Admin Login</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Sign in to edit this page&apos;s SEO settings.
      </p>

      <form action={loginAction} className="mt-6 space-y-4">
        <input type="hidden" name="redirect" value={redirectTo} />

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-foreground/80">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            autoComplete="username"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-4"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground/80">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-4"
          />
        </div>

        {hasError && (
          <p role="alert" className="text-sm font-medium text-red-600">
            Incorrect username or password.
          </p>
        )}

        <button
          type="submit"
          className="brand-gradient w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
