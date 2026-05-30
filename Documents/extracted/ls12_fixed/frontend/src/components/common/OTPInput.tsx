import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  error?: boolean;
  autoFocus?: boolean;
  onComplete?: (val: string) => void;
}

export const OTPInput = ({
  value,
  onChange,
  length = 6,
  error = false,
  autoFocus = true,
  onComplete,
}: Props) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (value.length === length) onComplete?.(value);
  }, [value, length, onComplete]);

  const setAt = (i: number, digit: string) => {
    const arr = value.padEnd(length, " ").split("");
    arr[i] = digit;
    const next = arr.join("").replace(/\s/g, "").slice(0, length);
    onChange(next);
  };

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    setAt(i, digit);
    if (i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (value[i]) {
        const arr = value.split("");
        arr[i] = "";
        onChange(arr.join(""));
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
        const arr = value.split("");
        arr[i - 1] = "";
        onChange(arr.join(""));
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div
      className={cn("flex gap-2 justify-center", error && "animate-shake")}
      role="group"
      aria-label="OTP input"
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          aria-label={`OTP digit ${i + 1}`}
          className={cn(
            "w-[44px] h-[56px] text-center text-xl font-semibold rounded-button border bg-card outline-none transition-all",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            error ? "border-destructive text-destructive" : "border-border text-foreground"
          )}
        />
      ))}
    </div>
  );
};
