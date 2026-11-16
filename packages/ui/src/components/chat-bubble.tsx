import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export function ChatBubble({
  variant = "system",
  children,
  className,
}: {
  variant?: "system" | "user";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
        variant === "system" && "bg-white text-calm-800 border border-calm-100",
        variant === "user" && "ml-auto bg-calm-800 text-white",
        className,
      )}
    >
      {children}
    </div>
  );
}