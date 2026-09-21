"use client";

export default function GalaxyHeader() {
  return (
    <div className="galaxy-header-bar">
      {/* Left accent line */}
      <div className="header-accent-line" />

      {/* Title cluster */}
      <div className="flex items-center gap-3">
        <div className="header-diamond" />
        <h1 className="galaxy-title">
          Galaxy Map
        </h1>
        <span className="galaxy-subtitle">Your curriculum</span>
        <div className="header-diamond" />
      </div>

      {/* Right accent line */}
      <div className="header-accent-line" />
    </div>
  );
}
