import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Crown, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useGuest } from "@/contexts/GuestContext";
import { usePremium } from "@/contexts/PremiumContext";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";

const SUBTITLE_KEY: Record<string, TranslationKey> = {
  guest_limit: "premSubGuest",
  video_call: "premSubVideo",
  document_limit: "premSubDoc",
  community_limit: "premSubCommunity",
  premium_feature: "premSubGeneric",
  follow_up: "premSubFollowUp",
};

const FEATURES: TranslationKey[] = [
  "premFeat1",
  "premFeat2",
  "premFeatVideo",
  "premFeat3",
  "premFeat4",
  "premFeat6",
  "premFeat5",
  "premFeatAdFree",
];

export const PremiumUpgradeModal = () => {
  const { open, trigger, close } = usePremium();
  const { t } = useLanguage();
  const { setIsPremium, isGuest } = useAuth();
  const { resetGuest } = useGuest();
  const navigate = useNavigate();

  const [loadingPlan, setLoadingPlan] = useState<null | "monthly" | "yearly">(null);
  const [success, setSuccess] = useState(false);

  // Reset internal UI when (re)opened
  useEffect(() => {
    if (open) {
      setLoadingPlan(null);
      setSuccess(false);
    }
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const dismissible = trigger !== "guest_limit"; // guest limit forces a choice
  const subKey = SUBTITLE_KEY[trigger ?? "premium_feature"] ?? "premSubGeneric";

  const purchase = (plan: "monthly" | "yearly") => {
    setLoadingPlan(plan);
    window.setTimeout(() => {
      setIsPremium(true);
      resetGuest();
      setSuccess(true);
    }, 1500);
  };

  const goHome = () => {
    close();
    navigate("/home", { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[80]">
      {/* Dim — non-dismissable */}
      <div className="absolute inset-0 bg-foreground/50" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "absolute bottom-0 left-0 right-0 mx-auto max-w-md bg-card rounded-t-3xl shadow-card",
          "animate-slide-up max-h-[92vh] overflow-y-auto"
        )}
      >
        {success ? (
          <SuccessView onDone={goHome} />
        ) : (
          <>
            <div className="flex justify-center pt-3">
              <span className="block w-10 h-1.5 rounded-full bg-border" />
            </div>

            {dismissible && (
              <button
                onClick={close}
                aria-label={t("close")}
                className="absolute top-3 right-3 w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center tap"
              >
                <X size={18} />
              </button>
            )}

            <div className="px-5 pt-2 pb-5">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-accent/15 text-accent flex items-center justify-center animate-[pulse_1.6s_ease-in-out_infinite]">
                  <Crown size={28} />
                </div>
                <h2 className="mt-3 text-[22px] font-display font-bold leading-tight">
                  {t("premTitle")}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground px-2">
                  {t(subKey)}
                </p>
              </div>

              <ul className="mt-5 space-y-2.5">
                {FEATURES.map((k) => (
                  <li key={k} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Check size={13} />
                    </span>
                    <span className="leading-snug">{t(k)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {/* Monthly */}
                <div className="ls-card p-3 flex flex-col">
                  <p className="text-xs text-muted-foreground">{t("monthly")}</p>
                  <p className="mt-1 text-2xl font-display font-bold text-primary leading-none">
                    ₹99<span className="text-xs text-muted-foreground font-normal">/{t("perMonth")}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-success">{t("cancelAnytime")}</p>
                  <Button
                    variant="secondary"
                    className="mt-3 h-10 text-xs"
                    loading={loadingPlan === "monthly"}
                    disabled={loadingPlan !== null}
                    onClick={() => purchase("monthly")}
                  >
                    {t("getMonthly")}
                  </Button>
                </div>

                {/* Yearly */}
                <div className="ls-card p-3 flex flex-col border-2 border-accent relative">
                  <span className="absolute -top-2 right-2 text-[10px] font-semibold bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                    {t("bestValue")}
                  </span>
                  <p className="text-xs text-muted-foreground">{t("yearly")}</p>
                  <p className="mt-1 text-2xl font-display font-bold text-accent leading-none">
                    ₹599<span className="text-xs text-muted-foreground font-normal">/{t("perYear")}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-success">{t("save589")}</p>
                  <Button
                    variant="amber"
                    className="mt-3 h-10 text-xs"
                    loading={loadingPlan === "yearly"}
                    disabled={loadingPlan !== null}
                    onClick={() => purchase("yearly")}
                  >
                    {t("getYearly")}
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-col items-center gap-2">
                <button className="text-xs text-muted-foreground tap py-1">{t("restorePurchase")}</button>
                <span className="block w-full border-t border-border" />
                <button onClick={close} className="text-xs text-muted-foreground tap py-1">
                  {t("continueAsGuest")}
                </button>
                {isGuest && (
                  <button
                    onClick={() => { close(); navigate("/login"); }}
                    className="text-xs text-primary font-semibold tap py-1"
                  >
                    {t("alreadyAccount")}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const SuccessView = ({ onDone }: { onDone: () => void }) => {
  const { t } = useLanguage();
  return (
    <div className="px-6 pt-10 pb-8 flex flex-col items-center text-center relative overflow-hidden">
      {/* Confetti */}
      <Confetti />
      <div className="w-20 h-20 rounded-full bg-primary/15 text-primary flex items-center justify-center animate-scale-in">
        <Check size={40} strokeWidth={3} />
      </div>
      <h2 className="mt-5 text-2xl font-display font-bold">{t("welcomePremium")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t("premiumActive")}</p>
      <Button fullWidth className="mt-6" onClick={onDone}>
        {t("startExploring")}
      </Button>
    </div>
  );
};

const Confetti = () => {
  const pieces = Array.from({ length: 24 });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {pieces.map((_, i) => {
        const left = (i * 4.3) % 100;
        const delay = (i * 0.07) % 1.2;
        const isAccent = i % 2 === 0;
        return (
          <span
            key={i}
            className={cn(
              "absolute top-0 w-1.5 h-3 rounded-sm opacity-90",
              isAccent ? "bg-accent" : "bg-primary"
            )}
            style={{
              left: `${left}%`,
              animation: `confetti-fall 2.4s ${delay}s ease-out forwards`,
            }}
          />
        );
      })}
    </div>
  );
};
