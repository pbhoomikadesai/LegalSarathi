import { useNavigate } from "react-router-dom";
import { X, Lock } from "lucide-react";
import { Button } from "@/components/common/Button";
import { useGuest } from "@/contexts/GuestContext";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Shown when a guest has consumed all 5 free interactions.
 * Asks them to sign up (phone) to continue.
 */
export const GuestLoginPrompt = () => {
  const { showLoginPrompt, closeLoginPrompt } = useGuest();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!showLoginPrompt) return null;

  const goLogin = () => {
    closeLoginPrompt();
    navigate("/login");
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in-up"
      onClick={closeLoginPrompt}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 pt-8 pb-6">
          <button
            onClick={closeLoginPrompt}
            aria-label="Close"
            className="absolute top-3 right-3 w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center tap"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Lock size={28} />
            </div>
            <h2 className="mt-4 text-xl font-display font-bold">{t("guestLimitTitle")}</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t("guestLimitBody")}
            </p>
          </div>

          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" />{t("guestPerk1")}</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" />{t("guestPerk2")}</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" />{t("guestPerk3")}</li>
          </ul>

          <Button fullWidth onClick={goLogin} className="mt-6">
            {t("signUpFullAccess")}
          </Button>
          <button
            onClick={closeLoginPrompt}
            className="block mx-auto mt-3 text-sm text-muted-foreground tap py-2"
          >
            {t("notNow")}
          </button>
        </div>
      </div>
    </div>
  );
};
