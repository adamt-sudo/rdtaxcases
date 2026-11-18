import { HubPage, hubMetadata } from "@/components/HubPage";

// /us/legislation: the list of every legislation page of the USA.
export const metadata = hubMetadata("us", "legislation-page");

export default function Page() {
  return <HubPage country="us" kind="legislation-page" />;
}
