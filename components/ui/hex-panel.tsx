"use client";

import { type ReactNode } from "react";

interface HexPanelProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  glow?: boolean;
  glowColor?: "cyan" | "warning" | "danger" | "success";
  className?: string;
  onClick?: () => void;
}

const glowMap = {
  cyan: "territory-glow-claimed",
  warning: "territory-glow-decaying",
  danger: "glow-danger",
  success: "glow-success",
};

export default function HexPanel({
  children,
  size = "md",
  glow = false,
  glowColor = "cyan",
  className = "",
  onClick,
}: HexPanelProps) {
  const sizeClass = size === "sm" ? "hex-panel-sm" : "";
  const glowClass = glow ? glowMap[glowColor] : "";
  const paddingClass =
    size === "sm" ? "p-3" : size === "lg" ? "p-6" : "p-4";

  return (
    <div
      className={`hex-panel ${sizeClass} ${glowClass} ${paddingClass} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
    >
      {children}
    </div>
  );
}
