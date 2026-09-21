import type { Metadata } from "next";

// The page is a client component, which cannot export metadata.
export const metadata: Metadata = { title: "Terminal Simulator" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
