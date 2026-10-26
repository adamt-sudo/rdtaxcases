import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".netlify/**",
    // Not our code: the vendored editor, generated data, cached downloads.
    "public/admin/**",
    "src/data/cases.index.ts",
    "scripts/output/**",
    "content/**",
  ]),
]);

export default eslintConfig;
