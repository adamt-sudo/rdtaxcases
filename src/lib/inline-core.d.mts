export type InlineNode =
  | { t: "text"; s: string }
  | { t: "em"; c: InlineNode[] }
  | { t: "strong"; c: InlineNode[] }
  | { t: "a"; href: string; external: boolean; c: InlineNode[] };

export const ALLOWED_HOSTS: string[];
export function safeHref(href: unknown): string | null;
export function isExternal(href: string): boolean;
export function decodeEntities(s: string): string;
export function encodeText(s: string): string;
export function parseInline(src: string): { nodes: InlineNode[]; problems: string[] };
export function plainText(src: string): string;
export function linksIn(src: string): { href: string; text: string }[];
export function inlineProblems(src: string): string[];
export function hasMarkup(src: string): boolean;
