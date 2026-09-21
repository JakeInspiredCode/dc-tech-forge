"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FilesystemTypes from "@/components/forge/explorer/filesystem-types";

function FilesystemTypesContent() {
  const searchParams = useSearchParams();
  const defaultMode = searchParams.get("mode") === "quiz" ? "quiz" : "learn";

  return (
    <div className="min-h-screen bg-v2-bg-deep">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mono mb-1">Filesystem Types</h1>
        <p className="text-sm text-forge-text-dim mb-6">
          Compare ext4, XFS, btrfs, NFS, tmpfs, overlay and more
        </p>
        <FilesystemTypes defaultMode={defaultMode as "learn" | "quiz"} />
      </div>
    </div>
  );
}

export default function FilesystemTypesPage() {
  return (
    <Suspense>
      <FilesystemTypesContent />
    </Suspense>
  );
}
