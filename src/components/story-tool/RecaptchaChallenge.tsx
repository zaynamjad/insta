"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Script from "next/script";
import { useTranslations } from "next-intl";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const ACTION = "SEARCH"; // keep in sync with RECAPTCHA_ACTION in src/lib/story/recaptcha.ts

declare global {
  interface Window {
    grecaptcha?: {
      enterprise: {
        ready: (cb: () => void) => void;
        render: (
          container: HTMLElement,
          options: {
            sitekey: string;
            action?: string;
            callback: (token: string) => void;
            "expired-callback"?: () => void;
            "error-callback"?: () => void;
          },
        ) => number;
        reset: (widgetId?: number) => void;
      };
    };
  }
}

export class RecaptchaCancelledError extends Error {
  constructor() {
    super("Verification cancelled.");
    this.name = "RecaptchaCancelledError";
  }
}

export interface RecaptchaHandle {
  /** Shows the reCAPTCHA checkbox and resolves with a single-use token once the visitor passes it. */
  getToken: () => Promise<string>;
}

/**
 * The checkbox challenge is shown in a modal only when `getToken()` is
 * called — i.e. after the visitor submits a username — and closes as soon
 * as they pass it. Closing it without passing rejects with
 * `RecaptchaCancelledError` so the caller can quietly abort the search.
 */
export const RecaptchaChallenge = forwardRef<RecaptchaHandle>(function RecaptchaChallenge(_props, ref) {
  const t = useTranslations("StoryTool");
  const [open, setOpen] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const pending = useRef<{ resolve: (token: string) => void; reject: (err: Error) => void } | null>(null);

  function settle(outcome: { token: string } | { error: Error }) {
    const current = pending.current;
    pending.current = null;
    setOpen(false);
    if (!current) return;
    if ("token" in outcome) current.resolve(outcome.token);
    else current.reject(outcome.error);
  }

  useImperativeHandle(ref, () => ({
    getToken: () =>
      new Promise<string>((resolve, reject) => {
        if (!SITE_KEY) {
          reject(new Error("reCAPTCHA is not configured."));
          return;
        }
        if (pending.current) {
          reject(new Error("Verification already in progress."));
          return;
        }
        pending.current = { resolve, reject };
        setOpen(true);
      }),
  }));

  // Renders the widget into the modal once it's open and the script has loaded.
  useEffect(() => {
    if (!open || !scriptReady || !SITE_KEY || !containerRef.current) return;
    const enterprise = window.grecaptcha?.enterprise;
    if (!enterprise) return;

    enterprise.ready(() => {
      if (!containerRef.current) return;
      if (widgetId.current === null) {
        widgetId.current = enterprise.render(containerRef.current, {
          sitekey: SITE_KEY,
          action: ACTION,
          callback: (token) => settle({ token }),
          "expired-callback": () => enterprise.reset(widgetId.current ?? undefined),
          "error-callback": () => settle({ error: new Error("Verification failed.") }),
        });
      } else {
        enterprise.reset(widgetId.current);
      }
    });
  }, [open, scriptReady]);

  // The modal unmounts its container on close, so a fresh render is needed next time.
  useEffect(() => {
    if (!open) widgetId.current = null;
  }, [open]);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://www.google.com/recaptcha/enterprise.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("recaptchaTitle")}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) settle({ error: new RecaptchaCancelledError() });
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <p className="text-base font-semibold text-foreground">{t("recaptchaTitle")}</p>
            <p className="mt-1 text-sm text-foreground/60">{t("recaptchaHint")}</p>
            <div ref={containerRef} className="mt-4 flex min-h-[78px] justify-center" />
            <button
              type="button"
              onClick={() => settle({ error: new RecaptchaCancelledError() })}
              className="mt-4 text-sm font-medium text-foreground/50 hover:text-foreground"
            >
              {t("recaptchaCancel")}
            </button>
          </div>
        </div>
      )}
    </>
  );
});
