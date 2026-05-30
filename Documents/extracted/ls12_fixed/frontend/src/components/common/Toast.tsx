import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface Props {
  message: string;
  variant?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export const Toast = ({ message, variant = "success", onClose, duration = 2500 }: Props) => {
  useEffect(() => {
    const id = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(id);
  }, [onClose, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-button shadow-card text-sm font-medium animate-toast-in max-w-[320px]",
        variant === "success" && "bg-success text-success-foreground",
        variant === "error" && "bg-destructive text-destructive-foreground",
        variant === "info" && "bg-foreground text-background"
      )}
    >
      {message}
    </div>
  );
};
