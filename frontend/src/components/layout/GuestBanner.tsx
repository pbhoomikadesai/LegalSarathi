import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGuest } from "@/contexts/GuestContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

/**
 * Persistent banner shown to guests under the header on protected pages.
 * Hidden if user is authenticated or premium.
 */
export const GuestBanner = () => {
  const { isGuest, isAuthenticated, isPremium } = useAuth();
  const { count, limit, remaining } = useGuest();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!isGuest || isAuthenticated || isPremium) return null;

  const pct = Math.max(0, Math.min(100, (remaining / limit) * 100));
  const color =
    remaining >= 3 ? "bg-primary" : remaining === 2 ? "bg-accent" : "bg-destructive";

  const label = t("guestBanner").replace("{n}", String(remaining));

  return (
    <button
      onClick={() => navigate("/login")}
      className="w-full max-w-md mx-auto px-4 py-2 bg-card border-b border-border text-left tap"
      aria-label={label}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold text-foreground/80 truncate">{label}</span>
        <span className="text-[10px] text-primary font-semibold whitespace-nowrap">
          {t("signUpFullAccess")} →
        </span>
      </div>
      <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
};
