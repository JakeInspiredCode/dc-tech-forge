import type { Metadata } from "next";
import ToolCrumb from "@/components/ui/tool-crumb";

// The page is a client component, which cannot export metadata.
export const metadata: Metadata = { title: "Command Dissector" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolCrumb title="Command Dissector" />
      {children}
    </>
  );
}
