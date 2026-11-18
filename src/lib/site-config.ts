// Settings that are written into the pages in one place.

/**
 * Zendesk web widget (the same widget as taxtrex.ai). The key is a public widget key, not a secret.
 * The widget script is added to the <head> of every page (src/app/layout.tsx).
 */
export const ZENDESK_KEY = "a9ac9ba6-8588-4267-830b-c3d1e2c3b7d7";
export const ZENDESK_SNIPPET_URL = `https://static.zdassets.com/ekr/snippet.js?key=${ZENDESK_KEY}`;
