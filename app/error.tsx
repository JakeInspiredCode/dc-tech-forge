"use client";

import ErrorScreen from "@/components/error-screen";

// The single route error boundary. It renders inside the root layout, so the
// nav stays usable. Per-route copies added nothing and have been removed.
export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen {...props} />;
}
