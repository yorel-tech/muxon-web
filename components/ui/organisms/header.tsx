"use client";

import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { BrandMark } from "@/components/BrandMark";
import { useOnClickOutside } from "@/lib/use-on-click-outside";

export interface HeaderProps {
  /** Optional slot rendered between the logo and the right-side actions (e.g. a tenant switcher). */
  tenantSwitcher?: React.ReactNode;
  notifications?: number;
  onSettingsClick?: () => void;
  onLogout?: () => void;
  className?: string;
}

export const Header = forwardRef<HTMLDivElement, HeaderProps>(
  (
    { tenantSwitcher, notifications = 0, onSettingsClick, onLogout, className = "" }: HeaderProps,
    ref
  ) => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const { isAuthenticated, user } = useAuth();
    const userMenuRef = useRef<HTMLDivElement>(null);
    const canShowUserMenu = isAuthenticated || Boolean(onSettingsClick) || Boolean(onLogout);
    const userDisplayName = user?.name ?? "User";

    useOnClickOutside(userMenuRef, () => setIsUserMenuOpen(false));

    return (
      <header
        ref={ref}
        className={cn(
          "h-16 flex items-center bg-primary-300 border-b border-primary-400",
          className
        )}
      >
        <div className="flex items-center justify-between w-full px-4">
          {/* Left: Logo + Tenant Switcher */}
          <div className="flex items-center gap-5">
            <div className="flex h-10 items-center gap-3 shrink-0">
              <BrandMark size={32} className="h-8 w-8 rounded-md" />
              <span className="text-xl font-bold text-[color:var(--text-primary)] whitespace-nowrap">
                muxon
              </span>
            </div>
            {tenantSwitcher && <div className="ml-4 flex h-10 items-center">{tenantSwitcher}</div>}
          </div>

          {/* Right: Notifications + User menu */}
          <div className="flex items-center gap-1">
            {/* Notifications (future-ready) */}
            <button
              className="relative p-2 rounded-md text-[color:var(--text-primary)] hover:bg-primary-400/35 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} strokeWidth={2.5} />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full text-xs font-medium text-white flex items-center justify-center">
                  {notifications > 99 ? "99+" : notifications}
                </span>
              )}
            </button>

            {/* User profile menu */}
            {canShowUserMenu && (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setIsUserMenuOpen((v) => !v)}
                  className="flex h-10 items-center gap-2 px-3 rounded-md border border-primary-500/40 bg-primary-100 text-[color:var(--text-primary)] hover:bg-primary-200/80 dark:hover:bg-primary-400/25 transition-colors"
                  aria-label="User menu"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={userDisplayName}
                      className="h-7 w-7 rounded-full object-cover ring-1 ring-primary-500/50"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-primary-500 flex items-center justify-center text-white text-base font-bold ring-1 ring-primary-400">
                      {userDisplayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-[color:var(--text-primary)] max-w-[120px] truncate">
                    {userDisplayName}
                  </span>
                  <ChevronDown size={14} className="text-[color:var(--text-secondary)]" />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-1 w-48 bg-surface rounded-lg border border-panel shadow-lg py-1 z-50"
                    >
                      {user?.email && (
                        <div className="px-4 py-2 border-b border-panel">
                          <p className="text-xs font-medium text-[color:var(--text-primary)] truncate">
                            {userDisplayName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user?.email}
                          </p>
                        </div>
                      )}
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[color:var(--text-primary)] hover:bg-sidebar-hover transition-colors"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                        }}
                      >
                        <User size={15} />
                        Profile
                      </button>
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[color:var(--text-primary)] hover:bg-sidebar-hover transition-colors"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onSettingsClick?.();
                        }}
                      >
                        <Settings size={15} />
                        Settings
                      </button>
                      <div className="border-t border-panel my-1" />
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout?.();
                        }}
                      >
                        <LogOut size={15} />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }
);

Header.displayName = "Header";
