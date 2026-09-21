import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    // Mirrors the "@/*" path alias in tsconfig.json.
    alias: [{ find: /^@\//, replacement: root }],
  },
  // tsconfig says `"jsx": "preserve"` (Next compiles JSX itself), which would
  // leave JSX untransformed here. Component tests need the automatic runtime.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    // The data layer talks to window.localStorage.
    environment: "jsdom",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", ".next-export/**", "out/**"],
    restoreMocks: true,
  },
});
