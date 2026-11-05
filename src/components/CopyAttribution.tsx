"use client";

import { useEffect } from "react";

/** Copies of more than this many characters get the attribution added. */
const MIN_CHARS = 100;

/**
 * When a visitor copies a longer passage from a case page, the clipboard also
 * gets the case name, the site and the page address. Short copies (a citation,
 * a name) are left alone. Renders nothing.
 */
export function CopyAttribution({ url, title }: { url: string; title: string }) {
  useEffect(() => {
    function onCopy(e: ClipboardEvent) {
      const sel = window.getSelection();
      const text = sel?.toString() ?? "";
      if (!sel || text.length <= MIN_CHARS || !e.clipboardData) return;
      const target = e.target as HTMLElement | null;
      // Leave copies from form fields alone.
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;

      const credit = `${title}, RDTAXCASES.com, a Swanson Reed database. ${url}`;
      const box = document.createElement("div");
      for (let i = 0; i < sel.rangeCount; i++) box.appendChild(sel.getRangeAt(i).cloneContents());
      const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const link = `<a href="${esc(url)}">${esc(title)}</a>`;
      e.clipboardData.setData("text/plain", `${text}\n\nSource: ${credit}`);
      e.clipboardData.setData(
        "text/html",
        `${box.innerHTML}<p>Source: ${link}, RDTAXCASES.com, a Swanson Reed database.</p>`,
      );
      e.preventDefault();
    }
    document.addEventListener("copy", onCopy);
    return () => document.removeEventListener("copy", onCopy);
  }, [url, title]);

  return null;
}
