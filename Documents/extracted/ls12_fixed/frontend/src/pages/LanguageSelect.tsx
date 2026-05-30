import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/common/Button";
import { LANGUAGES, type LangCode } from "@/i18n/languages";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { TRANSLATIONS } from "@/i18n/translations";
import { cn } from "@/lib/utils";

const LanguageSelect = () => {
  const navigate = useNavigate();
  const { setLang } = useLanguage();
  const { setChosenLanguage } = useAuth();
  const [selected, setSelected] = useState<LangCode | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    setLang(selected);
    setChosenLanguage(true);
    navigate("/login", { replace: true });
  };

  // Show note in selected language; default to English
  const noteLang = selected ?? "en";
  const noteText = TRANSLATIONS.changeAnytime[noteLang];

  return (
    <div className="min-h-[100dvh] bg-mandala">
      <div className="max-w-md mx-auto bg-background min-h-[100dvh] flex flex-col px-6 py-6">
        <h1 className="text-center text-lg font-display font-semibold leading-snug font-native">
          ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ <span className="text-muted-foreground">/</span>{" "}
          भाषा चुनें <span className="text-muted-foreground">/</span> Choose Language
        </h1>

        <div className="grid grid-cols-2 gap-3 mt-8">
          {LANGUAGES.map((l) => {
            const active = selected === l.code;
            return (
              <button
                key={l.code}
                onClick={() => setSelected(l.code)}
                aria-pressed={active}
                className={cn(
                  "relative h-[88px] rounded-2xl border-2 flex items-center justify-center font-native text-xl font-semibold tap transition-colors",
                  active
                    ? "bg-primary/5 text-primary border-primary"
                    : "bg-card text-foreground border-border hover:border-primary/40"
                )}
              >
                {l.native}
                {active && (
                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check size={14} className="text-primary-foreground" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-8 space-y-3">
          <Button fullWidth disabled={!selected} onClick={handleContinue}>
            {TRANSLATIONS.continue[noteLang]}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{noteText}</p>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelect;
