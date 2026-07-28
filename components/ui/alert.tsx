"use client";

import { cn } from "@/lib/utils";

export function Alert({
  variant = "default",
  className,
  children,
}: {
  variant?: "default" | "destructive";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border p-4 text-sm",
        variant === "destructive"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-gray-200 bg-gray-50 text-gray-900",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AlertDescription({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return <div className={cn("leading-relaxed", className)}>{children}</div>;
}
