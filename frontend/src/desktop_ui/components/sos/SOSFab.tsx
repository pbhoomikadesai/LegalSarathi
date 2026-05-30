import { useNavigate, useLocation } from "react-router-dom";
import { MessageCircle, ShieldAlert } from "lucide-react";
import { useSOS } from "@desktop/contexts/SOSContext";
import { useAuth } from "@desktop/contexts/AuthContext";
import { useLanguage } from "@desktop/contexts/LanguageContext";
import { cn } from "@desktop/lib/utils";

const HIDDEN_PATHS = [
  "/", "/splash", "/onboarding", "/onboarding-form", "/language",
  "/login", "/otp", "/chat",
];

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
    <div className="fixed z-40 right-6 bottom-8 pointer-events-none">
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <button
          onClick={show}
          aria-label={t("sosTitle")}
          className={cn(
            "flex items-center gap-2 h-10 pr-4 pl-3 rounded-full bg-destructive text-destructive-foreground shadow-card tap font-semibold text-xs hover:opacity-90 transition-opacity"
          )}
        >
          <ShieldAlert size={15} />
          SOS
        </button>
        <button
          onClick={() => navigate("/chat")}
          aria-label={t("aiChatbot")}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-card tap flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <MessageCircle size={22} />
        </button>
      </div>
    </div>
  );
};
