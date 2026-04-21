import nextConfig from "eslint-config-next";
import i18nPlugin from "./eslint/i18n-plugin.mjs";

const config = [
  ...nextConfig,
  {
    rules: {
      // This codebase is not yet aligned with the stricter React compiler-style
      // lint rules enabled by the current Next/ESLint stack. Keep them visible
      // without blocking routine lint runs.
      "react-hooks/error-boundaries": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/set-state-in-render": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    plugins: {
      i18n: i18nPlugin,
    },
    rules: {
      // During migration keep as warning; change to "error" once phase2/3 complete.
      "i18n/no-literal-ui-text": "warn",
    },
  },
  {
    ignores: ["node_modules/**", ".next/**", "out/**"],
  },
];

export default config;
