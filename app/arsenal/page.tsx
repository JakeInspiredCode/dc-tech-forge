"use client";

import { Suspense } from "react";
import Arsenal from "@/components/arsenal/arsenal";

export default function ArsenalPage() {
  return (
    <Suspense fallback={<div className="h-below-chrome w-full bg-v2-bg-deep" />}>
      <Arsenal />
    </Suspense>
  );
}
