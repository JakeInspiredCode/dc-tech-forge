"use client";

import { type ReactNode, type Ref } from "react";

interface ActionButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  /** For callers that manage focus, e.g. a dialog focusing its primary action. */
  ref?: Ref<HTMLButtonElement>;
}

const variantStyles = {
  primary:
    "bg-v2-cyan/15 text-v2-cyan border border-v2-cyan/40 hover:bg-v2-cyan/25 hover:border-v2-cyan v2-btn-glow",
  secondary:
    "bg-v2-bg-elevated text-v2-text border border-v2-border hover:border-v2-cyan/40 hover:text-v2-cyan v2-btn-glow",
  ghost:
    "text-v2-text-dim hover:text-v2-text hover:bg-v2-bg-elevated",
};

const sizeStyles = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function ActionButton({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  className = "",
  type = "button",
  ref,
}: ActionButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded transition-all duration-200 ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
    >
      {children}
    </button>
  );
}
