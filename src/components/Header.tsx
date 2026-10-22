import Image from "next/image";
import Link from "next/link";
import { CountryDropdown } from "./CountryDropdown";
import { swansonReedContact } from "@/data/contact";

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/branding/logo-full.png"
            alt="RDTAXCASES.com: International R&D Tax Credit Case Law Database"
            width={280}
            height={58}
            priority
            className="h-12 w-auto sm:h-16"
          />
        </Link>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href="/usa/states"
            className="text-sm font-medium text-slate-700 hover:text-blue-700"
          >
            USA States
          </Link>
          <Link
            href="/usa/federal"
            className="text-sm font-medium text-slate-700 hover:text-blue-700"
          >
            USA Federal
          </Link>
          <Link
            href="/search"
            className="text-sm font-medium text-slate-700 hover:text-blue-700"
          >
            Search
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-slate-700 hover:text-blue-700"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-slate-700 hover:text-blue-700"
          >
            Contact
          </Link>
          <a
            href={swansonReedContact.bookACallUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
          >
            Book a Call
          </a>
          <CountryDropdown />
        </nav>
      </div>
    </header>
  );
}
