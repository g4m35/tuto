"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  titleIcon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

const widthClasses = {
  sm: "w-[400px]",
  md: "w-[500px]",
  lg: "w-[600px]",
  xl: "w-[800px]",
};

/**
 * Shared Modal base component
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  titleIcon,
  children,
  footer,
  width = "md",
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
}: ModalProps) {
  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === "Escape") {
        onClose();
      }
    },
    [closeOnEscape, onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex animate-[t-fade_180ms_var(--ease-signature)_both] items-center justify-center bg-black/70 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <div
        className={`surface-panel ${widthClasses[width]} flex max-h-[90vh] flex-col overflow-hidden rounded-[var(--radius-lg)] animate-[t-scale-in_180ms_var(--ease-signature)_both]`}
      >
        {(title || titleIcon || showCloseButton) && (
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <h3 className="flex items-center gap-2 text-[15px] font-medium tracking-normal text-[var(--text)]">
              {titleIcon}
              {title}
            </h3>
            {showCloseButton ? (
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-faint)] transition-all duration-200 ease-[var(--ease-signature)] hover:bg-[var(--bg-elev-2)] hover:text-[var(--text)]"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <div />
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-[var(--border)] px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
