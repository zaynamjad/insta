"use client";

import { useState } from "react";
import { JsonLd } from "@/components/JsonLd";
import { faqPageSchema, type FaqItem } from "@/lib/seo/schema";

export function Faq({
  items,
  title,
  subtitle,
}: {
  items: FaqItem[];
  title: string;
  subtitle?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section aria-labelledby="faq-heading">
      <JsonLd data={faqPageSchema(items)} />
      <h2 id="faq-heading" className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-sm text-foreground/65 sm:text-base">{subtitle}</p>
      )}
      <div className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {items.map((item, index) => {
          const open = openIndex === index;
          return (
            <div key={item.question} className="group">
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors duration-200 hover:bg-surface-muted/60 sm:gap-4 sm:px-5"
              >
                <span className="min-w-0 break-words font-medium text-foreground transition-colors duration-200 group-hover:text-accent">
                  {item.question}
                </span>
                <span
                  aria-hidden
                  className={`shrink-0 text-foreground/50 transition-all duration-200 group-hover:text-accent ${
                    open ? "rotate-45" : ""
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
              {open && (
                <div className="break-words px-4 pb-4 text-sm leading-relaxed text-foreground/70 sm:px-5">
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
