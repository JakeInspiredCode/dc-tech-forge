export default function MissionsLoading() {
  return (
    <div className="h-[calc(100vh-var(--chrome-h))] w-full bg-v2-bg-deep flex items-center justify-center">
      <div className="flex items-center gap-3">
        <span className="embark-dot" style={{ background: "#8eafc8" }} />
        <span className="embark-dot" style={{ background: "#8eafc8", animationDelay: "120ms" }} />
        <span className="embark-dot" style={{ background: "#8eafc8", animationDelay: "240ms" }} />
        <span className="text-[#8eafc8] text-sm telemetry-font tracking-wider ml-2">
          Engaging drives…
        </span>
      </div>
    </div>
  );
}
