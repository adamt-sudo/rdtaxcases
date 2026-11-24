import { HubPage, hubMetadata } from "@/components/HubPage";

// /ca/faq: the list of every faq page of Canada.
export const metadata = hubMetadata("ca", "faq-question");

export default function Page() {
  return <HubPage country="ca" kind="faq-question" />;
}
