import { forwardRef } from "react";
import { TextField } from "./TextField";

interface Props {
  value: string;
  onChange: (digits: string) => void;
  error?: string;
  autoFocus?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, error, autoFocus }, ref) => {
    return (
      <TextField
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoFocus={autoFocus}
        value={value}
        maxLength={10}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
          onChange(digits);
        }}
        placeholder="98765 43210"
        error={error}
        leftAddon={
          <span className="flex items-center h-[52px] px-3 bg-muted text-foreground font-semibold text-[15px] border-r border-border select-none">
            +91
          </span>
        }
        aria-label="Mobile number"
      />
    );
  }
);
PhoneInput.displayName = "PhoneInput";
