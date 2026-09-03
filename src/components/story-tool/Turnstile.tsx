"use client";

import { forwardRef, useId, useImperativeHandle, useRef } from "react";
import Script from "next/script";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          size?: "normal" | "invisible";
          callback: (token: string) => void;
          "error-callback"?: () => void;
        },
      ) => string;
      execute: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

export interface TurnstileHandle {
  /** Runs an invisible challenge and resolves with a fresh, single-use token. */
  getToken: () => Promise<string>;
}

/**
 * Renders no visible UI — the widget runs in invisible mode and only
 * executes when `getToken()` is called (from the search form's submit
 * handler), so verification happens after the user clicks search rather
 * than gating the button itself.
 */
export const Turnstile = forwardRef<TurnstileHandle>(function Turnstile(_props, ref) {
  const containerId = `turnstile-${useId().replace(/:/g, "")}`;
  const widgetId = useRef<string | null>(null);
  const pending = useRef<{ resolve: (token: string) => void; reject: (err: Error) => void } | null>(null);

  function ensureRendered() {
    if (!SITE_KEY || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(`#${containerId}`, {
      sitekey: SITE_KEY,
      size: "invisible",
      callback: (token) => {
        pending.current?.resolve(token);
        pending.current = null;
      },
      "error-callback": () => {
        pending.current?.reject(new Error("Verification failed."));
        pending.current = null;
      },
    });
  }

  useImperativeHandle(ref, () => ({
    getToken: () =>
      new Promise<string>((resolve, reject) => {
        if (!SITE_KEY) {
          reject(new Error("Turnstile is not configured."));
          return;
        }
        if (!window.turnstile || !widgetId.current) {
          reject(new Error("Verification is still loading. Please try again."));
          return;
        }
        pending.current = { resolve, reject };
        window.turnstile.reset(widgetId.current);
        window.turnstile.execute(widgetId.current);
      }),
  }));

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onReady={ensureRendered}
      />
      <div id={containerId} />
    </>
  );
});
