"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

/**
 * `ssr:false` is only valid inside a Client Component boundary (the page
 * that renders this is a Server Component) — this file exists purely to
 * carry that boundary, so the actual three.js bundle only ever loads in
 * the browser, never during the server render.
 */
const HeroBlob3D = dynamic(
  () => import("./HeroBlob3D").then((mod) => mod.HeroBlob3D),
  { ssr: false },
);

/**
 * The wrapper in page.tsx is `hidden lg:block` for layout, but CSS
 * `display: none` doesn't stop React from mounting a component (and the
 * browser from fetching its JS) — it only hides the result. Gating the
 * actual mount behind a matching viewport check means phones never
 * download or run the three.js bundle at all, not just never see it.
 */
export function HeroBlob3DLazy() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  if (!isDesktop) return null;
  return <HeroBlob3D />;
}
