import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

// The page is a client component, which cannot export metadata. The template
// is restated because a nested title resets it for this segment's children
// (the per-topic study pages).
export const metadata: Metadata = {
  title: { default: "Flashcard Review", template: `%s · ${BRAND.name}` },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
