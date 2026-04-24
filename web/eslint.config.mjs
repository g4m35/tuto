import nextConfig from "eslint-config-next";
import i18nPlugin from "./eslint/i18n-plugin.mjs";

const migrationLintSeverity = process.env.STRICT_LINT_MIGRATIONS === "1" ? "warn" : "off";

const config = [
  ...nextConfig,
  {
    rules: {
      // This codebase is not yet aligned with the stricter React compiler-style
      // lint rules enabled by the current Next/ESLint stack. Keep routine lint
      // focused, and opt into this migration audit with STRICT_LINT_MIGRATIONS=1.
      "react-hooks/error-boundaries": migrationLintSeverity,
      "react-hooks/set-state-in-effect": migrationLintSeverity,
      "react-hooks/set-state-in-render": migrationLintSeverity,
      "react-hooks/immutability": migrationLintSeverity,
      "react-hooks/preserve-manual-memoization": migrationLintSeverity,
    },
  },
  {
    files: [
      "app/(workspace)/book/components/blocks/AnimationBlock.tsx",
      "components/common/RichMarkdownRenderer.tsx",
      "components/common/SimpleMarkdownRenderer.tsx",
      "components/math-animator/MathAnimatorViewer.tsx",
    ],
    rules: {
      // These render user/model-generated image URLs where next/image cannot
      // reliably infer dimensions or optimization behavior.
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    plugins: {
      i18n: i18nPlugin,
    },
    rules: {
      // Opt into the i18n migration audit with STRICT_LINT_MIGRATIONS=1.
      "i18n/no-literal-ui-text": migrationLintSeverity,
    },
  },
  {
    ignores: ["node_modules/**", ".next/**", "out/**"],
  },
];

export default config;
