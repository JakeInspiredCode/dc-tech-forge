"use client";

export type BadgeVariant =
  | "cyan"
  | "blue"
  | "success"
  | "warning"
  | "danger"
  | "purple"
  | "muted";

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  cyan: "bg-v2-cyan/10 text-v2-cyan border-v2-cyan/30",
  blue: "bg-v2-blue/10 text-v2-blue border-v2-blue/30",
  success: "bg-v2-success/10 text-v2-success border-v2-success/30",
  warning: "bg-v2-warning/10 text-v2-warning border-v2-warning/30",
  danger: "bg-v2-danger/10 text-v2-danger border-v2-danger/30",
  purple: "bg-v2-purple/10 text-v2-purple border-v2-purple/30",
  muted: "bg-v2-bg-elevated text-v2-text-dim border-v2-border",
};

export default function StatusBadge({
  label,
  variant = "cyan",
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium border rounded ${variantStyles[variant]} ${className}`}
    >
      {label}
    </span>
  );
}
