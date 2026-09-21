import type { Metadata } from "next";

// The page is a client component, which cannot export metadata.
export const metadata: Metadata = { title: "Speed Run" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
