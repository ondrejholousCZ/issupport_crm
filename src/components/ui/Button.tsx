import Link from "next/link";

const variants = {
  primary: "bg-primary hover:bg-primary-hover text-white",
  secondary: "bg-white border border-border text-foreground hover:bg-gray-50",
  danger: "bg-red-600 hover:bg-red-700 text-white",
} as const;

export function Button({
  href,
  variant = "primary",
  type = "button",
  className = "",
  children,
  ...props
}: {
  href?: string;
  variant?: keyof typeof variants;
  type?: "button" | "submit";
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = `inline-flex items-center justify-center rounded-lg font-medium px-4 py-2 text-sm transition-colors ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
