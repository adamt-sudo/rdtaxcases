import { HubPage, hubMetadata } from "@/components/HubPage";

// /ca/glossary: the list of every glossary page of Canada.
export const metadata = hubMetadata("ca", "glossary-term");

export default function Page() {
  return <HubPage country="ca" kind="glossary-term" />;
}
