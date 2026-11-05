import type { MetadataRoute } from "next";
import { cases, getCasesForJurisdiction } from "@/data/cases";
import { usStateJurisdictions } from "@/data/jurisdictions";
import { countries } from "@/data/countries";
import { absolute, caseHref, countryHref, stateHref, US_FEDERAL, US_HOME, US_STATES } from "@/lib/urls";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absolute("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absolute(US_HOME), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absolute(US_STATES), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absolute(US_FEDERAL), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    // Country pages without a published case are not in the sitemap.
    ...countries
      .filter((c) => getCasesForJurisdiction("country", c.slug).length > 0)
      .map((c) => ({
        url: absolute(countryHref(c.slug)),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      })),
    { url: absolute("/search"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absolute("/about"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absolute("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absolute("/copyright"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const stateRoutes: MetadataRoute.Sitemap = usStateJurisdictions.map((j) => ({
    url: absolute(stateHref(j.slug)),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const caseRoutes: MetadataRoute.Sitemap = cases.map((c) => ({
    url: absolute(caseHref(c)),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...stateRoutes, ...caseRoutes];
}
