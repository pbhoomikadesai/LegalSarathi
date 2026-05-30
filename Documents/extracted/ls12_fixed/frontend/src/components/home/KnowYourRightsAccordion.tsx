import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Scale, Sparkles } from "lucide-react";
import { RIGHTS_CARDS } from "@/data/rights";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGuest } from "@/contexts/GuestContext";
import { cn } from "@/lib/utils";

/**
 * Accordion replacement for the horizontal "Know Your Rights" carousel.
 * Each card expands to show 5 bullets + an "Ask LegalSarathi AI" CTA that
 * pre-fills the chat input with the topic question.
 */
export const KnowYourRightsAccordion = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { tryConsume } = useGuest();
  const [openId, setOpenId] = useState<string | null>(null);

  const askAi = (question: string) => {
    if (!tryConsume()) return; // upgrade modal will appear
    navigate("/chat", { state: { initialQuery: question } });
  };

  return (
    <section className="mt-7">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-display font-semibold">{t("knowYourRights")}</h2>
        <span className="text-[11px] text-muted-foreground">{t("kyrQuickGuide")}</span>
      </div>
      <div className="space-y-2">
        {RIGHTS_CARDS.map((card) => {
          const isOpen = openId === card.id;
          return (
            <div
              key={card.id}
              className={cn(
                "rounded-2xl border bg-card overflow-hidden transition-all",
                isOpen ? "border-primary/40 shadow-card" : "border-border"
              )}
            >
              <button
                onClick={() => setOpenId(isOpen ? null : card.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 px-4 py-3 text-left tap"
              >
                <span className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-primary shrink-0", card.iconBg)}>
                  <Scale size={18} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold leading-tight">{t(card.titleKey)}</span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    {card.bulletKeys.length} {t("kyrQuickGuide").toLowerCase()}
                  </span>
                </span>
                <ChevronDown
                  size={18}
                  className={cn("text-muted-foreground transition-transform shrink-0", isOpen && "rotate-180")}
                />
              </button>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-300 ease-out",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 pt-1 border-t border-border">
                    <ul className="space-y-2 mt-3">
                      {card.bulletKeys.map((bk) => (
                        <li key={bk} className="flex gap-2 text-sm leading-snug">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span>{t(bk)}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => askAi(card.prefilledQuestion)}
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold h-11 tap shadow-card"
                    >
                      <Sparkles size={15} />
                      {t("kyrAskAi")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
