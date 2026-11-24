import { HubPage, hubMetadata } from "@/components/HubPage";

// /ca/legislation: the list of every legislation page of Canada.
export const metadata = hubMetadata("ca", "legislation-page");

export default function Page() {
  return <HubPage country="ca" kind="legislation-page" />;
}
