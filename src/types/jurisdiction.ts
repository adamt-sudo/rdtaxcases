export type JurisdictionGroup = "usa-states" | "usa-federal" | "country";

export interface Jurisdiction {
  slug: string;
  name: string;
  group: JurisdictionGroup;
  /** ISO country code this jurisdiction belongs to. All Milestone 1 entries are "US". */
  countryCode: string;
}
