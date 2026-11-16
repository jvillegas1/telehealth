import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "../lib/cn";

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function Button({ className, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-calm-800 px-4 py-2 text-sm font-medium text-white",
          "hover:bg-calm-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-calm-800",
          "disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);