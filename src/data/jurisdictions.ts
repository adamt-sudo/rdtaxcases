import { Jurisdiction } from "@/types/jurisdiction";
import { countries, countryToJurisdiction } from "./countries";

const US_STATES: [name: string, slug: string][] = [
  ["Alabama", "alabama"],
  ["Alaska", "alaska"],
  ["Arizona", "arizona"],
  ["Arkansas", "arkansas"],
  ["California", "california"],
  ["Colorado", "colorado"],
  ["Connecticut", "connecticut"],
  ["Delaware", "delaware"],
  ["Florida", "florida"],
  ["Georgia", "georgia"],
  ["Hawaii", "hawaii"],
  ["Idaho", "idaho"],
  ["Illinois", "illinois"],
  ["Indiana", "indiana"],
  ["Iowa", "iowa"],
  ["Kansas", "kansas"],
  ["Kentucky", "kentucky"],
  ["Louisiana", "louisiana"],
  ["Maine", "maine"],
  ["Maryland", "maryland"],
  ["Massachusetts", "massachusetts"],
  ["Michigan", "michigan"],
  ["Minnesota", "minnesota"],
  ["Mississippi", "mississippi"],
  ["Missouri", "missouri"],
  ["Montana", "montana"],
  ["Nebraska", "nebraska"],
  ["Nevada", "nevada"],
  ["New Hampshire", "new-hampshire"],
  ["New Jersey", "new-jersey"],
  ["New Mexico", "new-mexico"],
  ["New York", "new-york"],
  ["North Carolina", "north-carolina"],
  ["North Dakota", "north-dakota"],
  ["Ohio", "ohio"],
  ["Oklahoma", "oklahoma"],
  ["Oregon", "oregon"],
  ["Pennsylvania", "pennsylvania"],
  ["Rhode Island", "rhode-island"],
  ["South Carolina", "south-carolina"],
  ["South Dakota", "south-dakota"],
  ["Tennessee", "tennessee"],
  ["Texas", "texas"],
  ["Utah", "utah"],
  ["Vermont", "vermont"],
  ["Virginia", "virginia"],
  ["Washington", "washington"],
  ["West Virginia", "west-virginia"],
  ["Wisconsin", "wisconsin"],
  ["Wyoming", "wyoming"],
];

export const usStateJurisdictions: Jurisdiction[] = US_STATES.map(
  ([name, slug]) => ({
    slug,
    name,
    group: "usa-states",
    countryCode: "US",
  })
);

export const usFederalJurisdiction: Jurisdiction = {
  slug: "federal",
  name: "USA Federal",
  group: "usa-federal",
  countryCode: "US",
};

export const countryJurisdictions: Jurisdiction[] = countries.map(
  countryToJurisdiction
);

export const jurisdictions: Jurisdiction[] = [
  usFederalJurisdiction,
  ...usStateJurisdictions,
  ...countryJurisdictions,
];

export function getJurisdictionBySlug(
  group: Jurisdiction["group"],
  slug: string
): Jurisdiction | undefined {
  return jurisdictions.find((j) => j.group === group && j.slug === slug);
}
