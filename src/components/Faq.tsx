"use client";

import { useState } from "react";
import { JsonLd } from "@/components/JsonLd";
import { faqPageSchema, type FaqItem } from "@/lib/seo/schema";

export function Faq({
  items,
  title = "Frequently Asked Questions",
}: {
  items: FaqItem[];
  title?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section aria-labelledby="faq-heading">
      <JsonLd data={faqPageSchema(items)} />
      <h2 id="faq-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
        {items.map((item, index) => {
          const open = openIndex === index;
          return (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-medium text-foreground">
                  {item.question}
                </span>
                <span
                  aria-hidden
                  className={`shrink-0 text-foreground/50 transition-transform ${
                    open ? "rotate-45" : ""
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
              {open && (
                <div className="px-5 pb-4 text-sm leading-relaxed text-foreground/70">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
