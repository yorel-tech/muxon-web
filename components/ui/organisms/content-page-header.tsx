"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnClickOutside } from "@/lib/use-on-click-outside";

export interface ContentPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function ContentPageHeader({
  title,
  description,
  actions,
  className,
}: ContentPageHeaderProps) {
  const descriptionText = description?.trim() ?? "";
  const hasDescription = descriptionText.length > 0;
  const descriptionId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [alignEnd, setAlignEnd] = useState(false);

  const open = hasDescription && !dismissed && (pinned || hovered || focused);

  useEffect(() => {
    if (!open || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    setAlignEnd(rect.left + 320 > window.innerWidth - 16);
  }, [open]);

  const closeFromOutside = useCallback(() => {
    setPinned(false);
    setHovered(false);
  }, []);

  useOnClickOutside(rootRef, closeFromOutside);

  const dismiss = () => {
    setPinned(false);
    setHovered(false);
    setDismissed(true);
    buttonRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    dismiss();
  };

  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-1">
        <h1 className="text-3xl font-bold text-[color:var(--text-primary)]">{title}</h1>
        {hasDescription ? (
          <div
            ref={rootRef}
            className="relative shrink-0"
            onMouseEnter={() => {
              setDismissed(false);
              setHovered(true);
            }}
            onMouseLeave={() => setHovered(false)}
          >
            <button
              ref={buttonRef}
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-console-muted hover:bg-console-hover hover:text-[color:var(--text-primary)]"
              aria-label={`About ${title}`}
              aria-expanded={open}
              aria-controls={descriptionId}
              aria-describedby={descriptionId}
              onFocus={() => {
                setDismissed(false);
                setFocused(true);
              }}
              onBlur={() => setFocused(false)}
              onClick={() => {
                setPinned((value) => {
                  if (value) {
                    setDismissed(true);
                    return false;
                  }
                  setDismissed(false);
                  return true;
                });
              }}
              onKeyDown={onKeyDown}
            >
              <Info className="h-5 w-5" aria-hidden />
            </button>
            <div
              className={cn(
                "absolute top-full z-30 pt-1",
                alignEnd ? "right-0" : "left-0",
                open ? "visible" : "invisible pointer-events-none"
              )}
            >
              <div
                id={descriptionId}
                role="tooltip"
                className="w-max max-w-[min(20rem,calc(100vw-2.5rem))] rounded-md border border-console-control bg-console-surface px-3 py-2 text-left text-sm font-normal leading-relaxed text-[color:var(--text-primary)] shadow-md"
              >
                {descriptionText}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
