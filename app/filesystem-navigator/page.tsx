"use client";

import { Suspense } from "react";
import ToolPage from "@/components/ui/tool-page";
import { useSearchParams, useRouter } from "next/navigation";
import FilesystemGame from "@/components/forge/explorer/filesystem-game";

function FilesystemNavigatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "label" ? "label" : "learn";

  return (
    <ToolPage title={mode === "label" ? "Filesystem Label Quiz" : "Filesystem Navigator"} subtitle={mode === "label" ? "Given a description, type the Linux path it belongs to." : "Walk the Linux directory tree and learn what lives where."} width="wide">
        <FilesystemGame mode={mode as "learn" | "label"} onBack={() => router.push("/arsenal")} />
    </ToolPage>
  );
}

export default function FilesystemNavigatorPage() {
  return (
    <Suspense>
      <FilesystemNavigatorContent />
    </Suspense>
  );
}
