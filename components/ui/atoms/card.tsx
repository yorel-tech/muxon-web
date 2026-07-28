"use client";

import { motion } from "framer-motion";
import { forwardRef, type ReactNode } from "react";

export interface CardProps {
  children?: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  bordered?: boolean;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
}

const paddingStyles: Record<string, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

const shadowStyles: Record<string, string> = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className = "",
      padding = "md",
      hover = false,
      bordered: _bordered = false,
      shadow = "none",
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        className={`
          bg-surface rounded-lg border border-panel
          ${paddingStyles[padding]}
          ${shadowStyles[shadow]}
          ${hover ? "hover:border-primary-500" : ""}
          transition-colors duration-200
          ${className}
        `}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";

export interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export const CardHeader = ({ children, className = "" }: CardHeaderProps) => {
  return <div className={`px-6 py-4 border-b border-primary-600/25 ${className}`}>{children}</div>;
};

export interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export const CardContent = ({ children, className = "" }: CardContentProps) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export const CardFooter = ({ children, className = "" }: CardFooterProps) => {
  return (
    <div
      className={`px-6 py-4 border-t border-primary-600/25 bg-surface rounded-b-lg ${className}`}
    >
      {children}
    </div>
  );
};

export interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export const CardTitle = ({ children, className = "" }: CardTitleProps) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>
);

export interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export const CardDescription = ({ children, className = "" }: CardDescriptionProps) => (
  <p className={`text-sm text-[color:var(--text-secondary)] mt-1 ${className}`}>{children}</p>
);
