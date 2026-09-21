"use client";

import { useRouter } from "next/navigation";
import ToolPage from "@/components/ui/tool-page";
import BootTriage from "@/components/forge/boot-process/boot-triage";

export default function BootTriagePage() {
  const router = useRouter();

  return (
    <ToolPage title="Boot Triage" subtitle="Diagnose boot failures from their symptoms and logs." width="wide">
        <BootTriage onBack={() => router.push("/arsenal")} />
    </ToolPage>
  );
}
