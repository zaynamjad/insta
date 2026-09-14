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
  async redirects() {
    return [
      { source: "/terms", destination: "/terms-and-conditions", permanent: true },
      { source: "/:locale/terms", destination: "/:locale/terms-and-conditions", permanent: true },
      { source: "/terms-condition", destination: "/terms-and-conditions", permanent: true },
      { source: "/:locale/terms-condition", destination: "/:locale/terms-and-conditions", permanent: true },
      { source: "/about", destination: "/about-us", permanent: true },
      { source: "/:locale/about", destination: "/:locale/about-us", permanent: true },
      { source: "/contact", destination: "/contact-us", permanent: true },
      { source: "/:locale/contact", destination: "/:locale/contact-us", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
