import { useEffect, type ReactNode } from "react";
import { cn } from "@desktop/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export const BottomSheet = ({ open, onClose, title, children, footer }: Props) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 animate-[fade-in-up_0.2s_ease-out]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "absolute bottom-0 left-0 right-0 mx-auto max-w-md bg-card rounded-t-3xl shadow-card",
          "animate-slide-up"
        )}
      >
        <div className="flex justify-center pt-3">
          <span className="block w-10 h-1.5 rounded-full bg-border" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-5 pt-3 pb-2">
            <h3 className="text-lg font-semibold font-display">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-5 pb-2 max-h-[75vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-5 pt-2 pb-[max(env(safe-area-inset-bottom),16px)]">{footer}</div>}
      </div>
    </div>
  );
};
