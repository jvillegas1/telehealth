import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn";

export function Alert({
  className,
  variant = "info",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: "info" | "error" | "success" }) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        variant === "info" && "border-calm-100 bg-calm-50 text-calm-800",
        variant === "error" && "border-red-200 bg-red-50 text-red-900",
        variant === "success" && "border-green-200 bg-green-50 text-green-900",
        className,
      )}
      {...props}
    />
  );
}