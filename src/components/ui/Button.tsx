"use client";

import Link from "next/link";
import { Spinner } from "./Spinner";

const variants = {
  primary: "bg-primary hover:bg-primary-hover text-white disabled:hover:bg-primary",
  secondary: "bg-white border border-border text-foreground hover:bg-gray-50 disabled:hover:bg-white",
  danger: "bg-red-600 hover:bg-red-700 text-white disabled:hover:bg-red-600",
} as const;

export function Button({
  href,
  variant = "primary",
  type = "button",
  className = "",
  children,
  loading = false,
  disabled,
  ...props
}: {
  href?: string;
  variant?: keyof typeof variants;
  type?: "button" | "submit";
  className?: string;
  children: React.ReactNode;
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = `inline-flex items-center justify-center rounded-lg font-medium px-4 py-2 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-h-[38px] min-w-[38px] ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading ? <Spinner /> : children}
    </button>
  );
}
