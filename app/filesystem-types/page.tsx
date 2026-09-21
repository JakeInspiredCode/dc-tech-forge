"use client";

import { Suspense } from "react";
import ToolPage from "@/components/ui/tool-page";
import { useSearchParams } from "next/navigation";
import FilesystemTypes from "@/components/forge/explorer/filesystem-types";

function FilesystemTypesContent() {
  const searchParams = useSearchParams();
  const defaultMode = searchParams.get("mode") === "quiz" ? "quiz" : "learn";

  return (
    <ToolPage
      title={defaultMode === "quiz" ? "Filesystem Types Quiz" : "Filesystem Types"}
      subtitle="Compare ext4, XFS, btrfs, NFS, tmpfs, overlay and more."
      width="wide"
    >
      <FilesystemTypes defaultMode={defaultMode as "learn" | "quiz"} />
    </ToolPage>
  );
}

export default function FilesystemTypesPage() {
  return (
    <Suspense>
      <FilesystemTypesContent />
    </Suspense>
  );
}
