import Link from "next/link";
import type { ComponentProps } from "react";
import { absoluteHref } from "@/lib/urls";

/**
 * A link to a page of this site. The page content and the code say paths ("/us/federal"); the rendered HTML says
 * the full address ("https://rdtaxcases.com/us/federal"). Links elsewhere (mailto:, other sites) pass through.
 */
export function SiteLink({ href, ...rest }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  return <Link href={absoluteHref(href)} {...rest} />;
}
