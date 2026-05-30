import { useState } from "react";
import { Check } from "lucide-react";
import { BottomSheet } from "@desktop/components/common/BottomSheet";
import { Button } from "@desktop/components/common/Button";
import { LANGUAGES, type LangCode } from "@desktop/i18n/languages";
import { useLanguage } from "@desktop/contexts/LanguageContext";
import { cn } from "@desktop/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const LanguageSwitcherSheet = ({ open, onClose }: Props) => {
  const { lang, applyWithShimmer, t } = useLanguage();
  const [pending, setPending] = useState<LangCode>(lang);

  const handleApply = () => {
    applyWithShimmer(pending);
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t("switchLanguage")}
      footer={
        <Button fullWidth onClick={handleApply}>
          {t("apply")}
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 py-2">
        {LANGUAGES.map((l) => {
          const active = pending === l.code;
          return (
            <button
              key={l.code}
              onClick={() => setPending(l.code)}
              aria-pressed={active}
              className={cn(
                "relative h-[72px] rounded-2xl border-2 flex items-center justify-center tap font-native text-lg font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/40"
              )}
            >
              {l.native}
              {active && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary-foreground/95 flex items-center justify-center">
                  <Check size={12} className="text-primary" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
};
