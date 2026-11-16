import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "../lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md border border-calm-100 bg-white px-3 text-base text-calm-900",
          "placeholder:text-calm-800/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-calm-800",
          className,
        )}
        {...props}
      />
    );
  },
);