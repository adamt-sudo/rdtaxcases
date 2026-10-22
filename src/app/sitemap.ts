import type { MetadataRoute } from "next";
import { cases, getCasesForJurisdiction } from "@/data/cases";
import { usStateJurisdictions } from "@/data/jurisdictions";
import { countries } from "@/data/countries";

const BASE_URL = "https://rdtaxcases.com";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/usa/states`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/usa/federal`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    // Country pages without a published case are not in the sitemap.
    ...countries
      .filter((c) => getCasesForJurisdiction("country", c.slug).length > 0)
      .map((c) => ({
      url: `${BASE_URL}/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    { url: `${BASE_URL}/search`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const stateRoutes: MetadataRoute.Sitemap = usStateJurisdictions.map((j) => ({
    url: `${BASE_URL}/usa/states/${j.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const caseRoutes: MetadataRoute.Sitemap = cases.map((c) => ({
    url: `${BASE_URL}/cases/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...stateRoutes, ...caseRoutes];
}
