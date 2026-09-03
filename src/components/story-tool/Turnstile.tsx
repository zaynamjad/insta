"use client";

import { useEffect, useId, useRef } from "react";
import Script from "next/script";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

/**
 * Renders nothing (and `onVerify` never fires) when
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't configured — the CAPTCHA gate is
 * opt-in infrastructure, not a hard requirement to run the app locally.
 */
export function Turnstile({
  onVerify,
  resetSignal,
}: {
  onVerify: (token: string | null) => void;
  /** Bump this (e.g. a counter) after a token has been consumed by a submit, so the widget issues a fresh one. */
  resetSignal?: number;
}) {
  const containerId = `turnstile-${useId().replace(/:/g, "")}`;
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(`#${containerId}`, {
      sitekey: SITE_KEY,
      callback: (token) => onVerify(token),
      "expired-callback": () => onVerify(null),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  useEffect(() => {
    if (resetSignal === undefined || !widgetId.current || !window.turnstile) return;
    window.turnstile.reset(widgetId.current);
  }, [resetSignal]);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onReady={() => {
          if (!widgetId.current && window.turnstile) {
            widgetId.current = window.turnstile.render(`#${containerId}`, {
              sitekey: SITE_KEY,
              callback: (token) => onVerify(token),
              "expired-callback": () => onVerify(null),
            });
          }
        }}
      />
      <div id={containerId} className="mt-3" />
    </>
  );
}
