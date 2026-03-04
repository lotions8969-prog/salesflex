import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        {
          "bg-blue-100 text-blue-800": variant === "default",
          "bg-gray-100 text-gray-800": variant === "secondary",
          "bg-red-100 text-red-800": variant === "destructive",
          "border border-gray-300 text-gray-700": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
