import { HubPage, hubMetadata } from "@/components/HubPage";

// /us/glossary: the list of every glossary page of the USA.
export const metadata = hubMetadata("us", "glossary-term");

export default function Page() {
  return <HubPage country="us" kind="glossary-term" />;
}
