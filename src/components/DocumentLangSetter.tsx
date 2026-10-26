"use client";

import { useEffect } from "react";

/**
 * The root layout hardcodes <html lang="en"> and static export has no
 * per-request mechanism to vary it per route, so this patches the DOM
 * post-hydration as a partial mitigation — it doesn't fix the lang
 * attribute in the pre-hydration static HTML source.
 */
export function DocumentLangSetter({ locale }: { locale: string }) {
  useEffect(() => {
    const original = document.documentElement.lang;
    document.documentElement.lang = locale;
    return () => {
      document.documentElement.lang = original;
    };
  }, [locale]);

  return null;
}
