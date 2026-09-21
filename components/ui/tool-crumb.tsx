import Link from "next/link";

// Where am I, and how do I get back — the same strip on every Arsenal tool.
// It sits in each tool's layout.tsx, aligned with the nav rather than with the
// page (the tools all use different content widths).
export default function ToolCrumb({ title }: { title: string }) {
  return (
    <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 text-xs flex items-center gap-2">
      <Link
        href="/arsenal"
        className="inline-flex items-center max-md:min-h-[44px] text-v2-text-dim hover:text-v2-text underline-offset-4 hover:underline"
      >
        ← Arsenal
      </Link>
      <span aria-hidden="true" className="text-v2-text-muted">
        /
      </span>
      <span aria-current="page" className="text-v2-text-muted truncate">
        {title}
      </span>
    </nav>
  );
}
