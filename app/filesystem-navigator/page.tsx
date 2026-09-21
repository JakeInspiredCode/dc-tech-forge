"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import FilesystemGame from "@/components/forge/explorer/filesystem-game";

function FilesystemNavigatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "label" ? "label" : "learn";

  return (
    <div className="min-h-screen bg-v2-bg-deep">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <FilesystemGame mode={mode as "learn" | "label"} onBack={() => router.push("/arsenal")} />
      </div>
    </div>
  );
}

export default function FilesystemNavigatorPage() {
  return (
    <Suspense>
      <FilesystemNavigatorContent />
    </Suspense>
  );
}
