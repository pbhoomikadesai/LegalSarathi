import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@desktop/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, Props>(
  ({ label, helper, error, leftAddon, rightAddon, className, id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-2 font-display">
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex items-center w-full bg-card border rounded-button overflow-hidden transition-colors",
            "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15",
            error ? "border-destructive" : "border-border"
          )}
        >
          {leftAddon}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "flex-1 bg-transparent px-4 h-[52px] text-[15px] outline-none placeholder:text-muted-foreground",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-err` : undefined}
            {...rest}
          />
          {rightAddon}
        </div>
        {error ? (
          <p id={`${inputId}-err`} className="mt-2 text-xs text-destructive">
            {error}
          </p>
        ) : helper ? (
          <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
        ) : null}
      </div>
    );
  }
);
TextField.displayName = "TextField";
