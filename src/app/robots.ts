import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The case editor is for the team, not for search engines.
      disallow: "/admin/",
    },
    sitemap: "https://rdtaxcases.com/sitemap.xml",
  };
}
