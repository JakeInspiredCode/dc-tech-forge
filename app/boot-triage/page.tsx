"use client";

import { useRouter } from "next/navigation";
import BootTriage from "@/components/forge/boot-process/boot-triage";

export default function BootTriagePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-v2-bg-deep">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <BootTriage onBack={() => router.push("/arsenal")} />
      </div>
    </div>
  );
}
