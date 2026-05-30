import { useNavigate, useLocation } from "react-router-dom";
import { MessageCircle, ShieldAlert } from "lucide-react";
import { useSOS } from "@/contexts/SOSContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const HIDDEN_PATHS = [
  "/", "/splash", "/onboarding", "/onboarding-form", "/language",
  "/login", "/otp", "/chat",
];

/**
 * Floating action button with two micro-actions:
 *  - Primary tap: open AI chat
 *  - SOS tap: open emergency call sheet
 * Only renders on protected pages, never on auth/onboarding/chat itself.
 */
export const SOSFab = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { show } = useSOS();
  const { isAuthenticated, isGuest } = useAuth();
  const { t } = useLanguage();

  const onProtected = isAuthenticated || isGuest;
  if (!onProtected) return null;
  if (HIDDEN_PATHS.includes(location.pathname)) return null;

  return (
    <div className="fixed z-40 right-4 bottom-24 max-w-md mx-auto pointer-events-none">
      {/* Wrap so the actions sit at the right edge inside the centered max-w container */}
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <button
          onClick={show}
          aria-label={t("sosTitle")}
          className={cn(
            "group flex items-center gap-2 h-11 pr-4 pl-3 rounded-full bg-destructive text-destructive-foreground shadow-card tap font-semibold text-xs"
          )}
        >
          <ShieldAlert size={16} />
          SOS
        </button>
        <button
          onClick={() => navigate("/chat")}
          aria-label={t("aiChatbot")}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-card tap flex items-center justify-center"
        >
          <MessageCircle size={22} />
        </button>
      </div>
    </div>
  );
};
