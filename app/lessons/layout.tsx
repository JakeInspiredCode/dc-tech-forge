import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import ToolCrumb from "@/components/ui/tool-crumb";

// The template is restated because a nested title resets it for this segment's
// children (the individual lessons).
export const metadata: Metadata = {
  title: { default: "Lesson Library", template: `%s · ${BRAND.name}` },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolCrumb title="Lesson Library" />
      {children}
    </>
  );
}
