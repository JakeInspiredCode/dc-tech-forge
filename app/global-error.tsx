"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0f] text-[#e0e0e8] min-h-screen flex items-center justify-center px-4">
        <main className="max-w-md text-center">
          <div className="text-4xl mb-4">!!</div>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: "monospace" }}>
            Critical Error
          </h2>
          <p className="text-[#b4c2d8] text-sm mb-6">
            {error.message || "The application encountered a fatal error."}
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-500 transition-colors"
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
