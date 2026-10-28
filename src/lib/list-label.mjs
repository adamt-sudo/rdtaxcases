// The editor's case list shows "<title>, <case number>". When the title already contains the case
// number (for example a title that is the number itself), the number would show twice: drop the repeat.
// Decap's summary template cannot test this, so the editor page does it (public/admin/preview.js,
// generated from this file by scripts/build-admin-config.mjs).
export function dropRepeatedNumber(text) {
  const i = text.lastIndexOf(", ");
  if (i <= 0) return text;
  const before = text.slice(0, i).trim();
  const after = text.slice(i + 2).trim();
  return after && before.toLowerCase().includes(after.toLowerCase()) ? before : text;
}
