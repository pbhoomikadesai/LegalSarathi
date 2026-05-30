import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@desktop/components/common/Button";
import { LANGUAGES, type LangCode } from "@desktop/i18n/languages";
import { useLanguage } from "@desktop/contexts/LanguageContext";
import { useAuth } from "@desktop/contexts/AuthContext";
import { TRANSLATIONS } from "@desktop/i18n/translations";
import { cn } from "@desktop/lib/utils";

const LanguageSelect = () => {
  const navigate = useNavigate();
  const { setLang, t } = useLanguage();
  const { setChosenLanguage } = useAuth();
  const [selected, setSelected] = useState<LangCode | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    setLang(selected);
    setChosenLanguage(true);
    navigate("/login", { replace: true });
  };

  const noteLang = selected ?? "en";
  const noteText = (TRANSLATIONS as Record<string, Record<string, string>>)["changeAnytime"]?.[noteLang];

  return (
    <div className="min-h-screen bg-mandala flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-background rounded-3xl shadow-card p-10 animate-fade-in-up">
        <h1 className="text-center text-xl font-display font-semibold leading-snug font-native mb-8">
          ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ <span className="text-muted-foreground">/</span>{" "}
          भाषा चुनें <span className="text-muted-foreground">/</span> Choose Language
        </h1>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {LANGUAGES.map((l) => {
            const active = selected === l.code;
            return (
              <button
                key={l.code}
                onClick={() => setSelected(l.code)}
                aria-pressed={active}
                className={cn(
                  "relative h-20 rounded-2xl border-2 flex items-center justify-center font-native text-lg font-semibold tap transition-colors",
                  active ? "bg-primary/5 text-primary border-primary" : "bg-card text-foreground border-border hover:border-primary/40"
                )}
              >
                {l.native}
                {active && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check size={12} className="text-primary-foreground" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selected && noteText && <p className="text-center text-xs text-muted-foreground mb-4 font-native">{noteText}</p>}
        <Button fullWidth disabled={!selected} onClick={handleContinue}>
          {t("next")}
        </Button>
      </div>
    </div>
  );
};

export default LanguageSelect;
