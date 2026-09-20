import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".next-export/**",
      "out/**",
      "coverage/**",
      "node_modules/**",
      "next-env.d.ts",
      "convex/_generated/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Lessons are prose-heavy; escaping every apostrophe hurts readability
      // of the source and changes nothing about the rendered output.
      "react/no-unescaped-entities": "off",
    },
  },
  {
    // 3k-line lesson file migrated from JSX under @ts-nocheck; it is slated to
    // be split and typed. Until then:
    //  - allow the @ts-nocheck banner
    //  - jsx-key only fires on <InfoTable rows> data cells, each of which is
    //    rendered alone inside an already-keyed <td>, so React never sees them
    //    as a sibling list
    files: ["components/linux-foundations.tsx"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "react/jsx-key": "off",
    },
  },
];

export default eslintConfig;
