import { HubPage, hubMetadata } from "@/components/HubPage";

// /us/faq: the list of every faq page of the USA.
export const metadata = hubMetadata("us", "faq-question");

export default function Page() {
  return <HubPage country="us" kind="faq-question" />;
}
