import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Off the map" };

export default function NotFound() {
  return (
    <div className="h-below-chrome w-full flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <p className="telemetry-font text-sm tracking-widest text-v2-amber mb-3">404 · NO SIGNAL</p>
        <h1 className="display-font text-2xl text-v2-cyan tracking-wider mb-4">Off the map</h1>
        <p className="text-v2-text leading-relaxed mb-8">
          There&apos;s nothing at this address. It may have moved, or the link may be mistyped.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded border border-v2-cyan/50 text-v2-cyan hover:border-v2-cyan transition-colors"
          >
            Back to the Galaxy Map
          </Link>
          <Link
            href="/missions"
            className="px-4 py-2 rounded border border-v2-border text-v2-text hover:border-v2-cyan/40 transition-colors"
          >
            Browse missions
          </Link>
        </div>
      </div>
    </div>
  );
}
