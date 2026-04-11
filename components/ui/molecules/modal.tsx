'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { forwardRef, useEffect, type ReactNode } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Rendered between the title and the close button (e.g. extra actions). */
  titleActions?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscapeKey?: boolean;
}

const sizeStyles: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
  full: 'max-w-5xl',
};

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      titleActions,
      children,
      size = 'md',
      showClose = true,
      closeOnOverlayClick = true,
      closeOnEscapeKey = true,
    },
    ref
  ) => {
    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && closeOnEscapeKey) {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }, [isOpen, onClose, closeOnEscapeKey]);

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeOnOverlayClick ? onClose : undefined}
                aria-hidden
              />
              <motion.div
                ref={ref}
                className={`relative z-10 bg-surface rounded-xl border border-panel ${sizeStyles[size]} w-full max-h-[90vh] overflow-hidden flex flex-col`}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 px-6 py-4 min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate min-w-0 flex-1">
                    {title}
                  </h2>
                  <div className="flex items-center gap-2 shrink-0">
                    {titleActions}
                    {showClose && (
                      <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        aria-label="Close modal"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                  {children}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
);

Modal.displayName = 'Modal';
