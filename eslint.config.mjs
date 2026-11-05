import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // beUI's motion components (src/components/motion/**) are vendored from
  // beui.dev. They deliberately pass refs through context and mutate DOM
  // nodes inside layout effects, which the React Compiler lint rules shipped
  // by eslint-config-next 16 report as "refs during render" / "immutability"
  // false positives. The React Compiler is not enabled in this project, so
  // keep the classic rules-of-hooks and exhaustive-deps checks but skip the
  // compiler-only rules for the vendored directory. Revisit after a beUI
  // upgrade.
  {
    files: ["src/components/motion/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/immutability": "off",
      "react-hooks/incompatible-library": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
