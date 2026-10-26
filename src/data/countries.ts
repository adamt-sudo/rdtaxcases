import { Jurisdiction } from "@/types/jurisdiction";
import { CaseUiLabels, LABELS } from "./country-labels";

/**
 * uiLabels are a first-pass draft, not a certified translation — flag for
 * client sign-off before treating any country's copy here as final.
 */
export interface CountryUiLabels extends CaseUiLabels {
  description: string;
  /** Shown on a country page that has no published case yet. */
  noCases: string;
}

export interface Country {
  slug: string;
  name: string;
  nativeName: string;
  locale: string;
  countryCode: string;
  uiLabels: CountryUiLabels;
}

const NO_CASES = "There is no case law for this country yet.";

/**
 * One row per country page. \`lang\` picks the interface label set in
 * country-labels.ts, and is the language of the country's sample case. A
 * country with no sample case yet uses English labels and the
 * "no case law yet" page (and is kept out of search engines until a case
 * exists; see src/app/[country]/page.tsx).
 */
const ROWS: {
  slug: string;
  name: string;
  nativeName: string;
  countryCode: string;
  lang: keyof typeof LABELS;
  locale?: string;
  description?: string;
}[] = [
  { slug: "it", name: "Italy", nativeName: "Italia", countryCode: "IT", lang: "it", description: "Giurisprudenza italiana sul credito d'imposta per ricerca e sviluppo." },
  { slug: "at", name: "Austria", nativeName: "Österreich", countryCode: "AT", lang: "de" },
  { slug: "sk", name: "Slovakia", nativeName: "Slovensko", countryCode: "SK", lang: "en" },
  { slug: "no", name: "Norway", nativeName: "Norge", countryCode: "NO", lang: "no", locale: "nb" },
  { slug: "es", name: "Spain", nativeName: "España", countryCode: "ES", lang: "es" },
  { slug: "in", name: "India", nativeName: "India", countryCode: "IN", lang: "en" },
  { slug: "mx", name: "Mexico", nativeName: "México", countryCode: "MX", lang: "en" },
  { slug: "co", name: "Colombia", nativeName: "Colombia", countryCode: "CO", lang: "es" },
  { slug: "cn", name: "China", nativeName: "中国", countryCode: "CN", lang: "en" },
  { slug: "tw", name: "Taiwan", nativeName: "臺灣", countryCode: "TW", lang: "zh", locale: "zh-TW" },
  { slug: "tr", name: "Turkey", nativeName: "Türkiye", countryCode: "TR", lang: "tr" },
  { slug: "rs", name: "Serbia", nativeName: "Srbija", countryCode: "RS", lang: "en" },
  { slug: "ro", name: "Romania", nativeName: "România", countryCode: "RO", lang: "en" },
  { slug: "ph", name: "Philippines", nativeName: "Pilipinas", countryCode: "PH", lang: "en" },
  { slug: "pe", name: "Peru", nativeName: "Perú", countryCode: "PE", lang: "es" },
  { slug: "mt", name: "Malta", nativeName: "Malta", countryCode: "MT", lang: "en" },
  { slug: "jp", name: "Japan", nativeName: "日本", countryCode: "JP", lang: "ja" },
  { slug: "is", name: "Iceland", nativeName: "Ísland", countryCode: "IS", lang: "is" },
  { slug: "id", name: "Indonesia", nativeName: "Indonesia", countryCode: "ID", lang: "id" },
  { slug: "hk", name: "Hong Kong", nativeName: "香港", countryCode: "HK", lang: "en" },
  { slug: "al", name: "Albania", nativeName: "Shqipëria", countryCode: "AL", lang: "en" },
  { slug: "pt", name: "Portugal", nativeName: "Portugal", countryCode: "PT", lang: "pt" },
  { slug: "pl", name: "Poland", nativeName: "Polska", countryCode: "PL", lang: "pl" },
  { slug: "lt", name: "Lithuania", nativeName: "Lietuva", countryCode: "LT", lang: "en" },
  { slug: "hu", name: "Hungary", nativeName: "Magyarország", countryCode: "HU", lang: "hu" },
  { slug: "cz", name: "Czechia", nativeName: "Česko", countryCode: "CZ", lang: "cs" },
  { slug: "my", name: "Malaysia", nativeName: "Malaysia", countryCode: "MY", lang: "en" },
  { slug: "br", name: "Brazil", nativeName: "Brasil", countryCode: "BR", lang: "pt", locale: "pt-BR" },
  { slug: "za", name: "South Africa", nativeName: "South Africa", countryCode: "ZA", lang: "en" },
  { slug: "kr", name: "South Korea", nativeName: "대한민국", countryCode: "KR", lang: "ko" },
  { slug: "be", name: "Belgium", nativeName: "België", countryCode: "BE", lang: "nl", locale: "nl-BE" },
  { slug: "lu", name: "Luxembourg", nativeName: "Lëtzebuerg", countryCode: "LU", lang: "en" },
  { slug: "gr", name: "Greece", nativeName: "Ελλάδα", countryCode: "GR", lang: "el" },
  { slug: "fi", name: "Finland", nativeName: "Suomi", countryCode: "FI", lang: "fi" },
  { slug: "dk", name: "Denmark", nativeName: "Danmark", countryCode: "DK", lang: "da" },
  { slug: "de", name: "Germany", nativeName: "Deutschland", countryCode: "DE", lang: "de" },
  { slug: "cl", name: "Chile", nativeName: "Chile", countryCode: "CL", lang: "en" },
  { slug: "si", name: "Slovenia", nativeName: "Slovenija", countryCode: "SI", lang: "sl" },
  { slug: "hr", name: "Croatia", nativeName: "Hrvatska", countryCode: "HR", lang: "en" },
  { slug: "cy", name: "Cyprus", nativeName: "Κύπρος", countryCode: "CY", lang: "en" },
  { slug: "ru", name: "Russia", nativeName: "Россия", countryCode: "RU", lang: "ru" },
  { slug: "th", name: "Thailand", nativeName: "ประเทศไทย", countryCode: "TH", lang: "th" },
  { slug: "tn", name: "Tunisia", nativeName: "تونس", countryCode: "TN", lang: "en" },
  { slug: "vn", name: "Vietnam", nativeName: "Việt Nam", countryCode: "VN", lang: "en" },
  { slug: "me", name: "Montenegro", nativeName: "Crna Gora", countryCode: "ME", lang: "en" },
  { slug: "fr", name: "France", nativeName: "France", countryCode: "FR", lang: "fr" },
  { slug: "ca", name: "Canada", nativeName: "Canada", countryCode: "CA", lang: "en" },
  { slug: "nz", name: "New Zealand", nativeName: "New Zealand", countryCode: "NZ", lang: "en" },
  { slug: "gb", name: "United Kingdom", nativeName: "United Kingdom", countryCode: "GB", lang: "en" },
  { slug: "au", name: "Australia", nativeName: "Australia", countryCode: "AU", lang: "en" },
  { slug: "sg", name: "Singapore", nativeName: "Singapore", countryCode: "SG", lang: "en" },
  { slug: "ie", name: "Ireland", nativeName: "Éire", countryCode: "IE", lang: "en", locale: "en-IE" },
];

/**
 * All 52 country pages. A page with no published case shows "no case law
 * yet" and is not indexed; one with a case lists it.
 */
export const countries: Country[] = ROWS.map((r) => {
  const set = LABELS[r.lang];
  const { caseLaw, ...caseLabels } = set;
  return {
    slug: r.slug,
    name: r.name,
    nativeName: r.nativeName,
    locale: r.locale ?? (r.lang as string),
    countryCode: r.countryCode,
    uiLabels: {
      ...caseLabels,
      description: r.description ?? `${r.name}: ${caseLaw}.`,
      noCases: NO_CASES,
    },
  };
});

export function countryToJurisdiction(country: Country): Jurisdiction {
  return {
    slug: country.slug,
    name: country.name,
    group: "country",
    countryCode: country.countryCode,
  };
}
