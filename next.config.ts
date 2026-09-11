import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    // Next.js 15 changed this default from "inline" to "attachment", which
    // breaks in-page <img> rendering for optimized images in some browsers.
    contentDispositionType: "inline",
  },
};

export default withNextIntl(nextConfig);
