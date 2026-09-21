"use client";

import { useRouter } from "next/navigation";
import ToolPage from "@/components/ui/tool-page";
import BootLearn from "@/components/forge/boot-process/boot-learn";

export default function BootLearnPage() {
  const router = useRouter();

  return (
    <ToolPage title="Boot Process — Learn" subtitle="How a server gets from the power button to a login prompt, in three layers of detail." width="wide">
        <BootLearn onBack={() => router.push("/arsenal")} />
    </ToolPage>
  );
}
