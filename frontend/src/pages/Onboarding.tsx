import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const SLIDE_ART: { id: 1 | 2 | 3 }[] = [{ id: 1 }, { id: 2 }, { id: 3 }];

const SlideArt = ({ id }: { id: 1 | 2 | 3 }) => {
  if (id === 1) {
    return (
      <svg viewBox="0 0 240 200" className="w-full h-full">
        <rect x="20" y="40" rx="16" width="130" height="60" fill="hsl(var(--primary-tint))" />
        <text x="40" y="78" fontSize="22" fontFamily="Noto Sans Devanagari" fill="hsl(var(--primary))">कानून</text>
        <rect x="80" y="110" rx="16" width="140" height="60" fill="hsl(var(--accent-tint))" />
        <text x="100" y="150" fontSize="22" fontFamily="Noto Sans Kannada" fill="hsl(var(--accent))">ಕಾನೂನು</text>
        <circle cx="200" cy="40" r="10" fill="hsl(var(--primary))" opacity="0.2" />
      </svg>
    );
  }
  if (id === 2) {
    return (
      <svg viewBox="0 0 240 200" className="w-full h-full">
        <rect x="60" y="20" width="120" height="160" rx="8" fill="white" stroke="hsl(var(--primary))" strokeWidth="2" />
        <line x1="80" y1="50" x2="160" y2="50" stroke="hsl(var(--primary))" strokeWidth="2" />
        <line x1="80" y1="70" x2="160" y2="70" stroke="hsl(var(--border))" strokeWidth="2" />
        <line x1="80" y1="90" x2="140" y2="90" stroke="hsl(var(--border))" strokeWidth="2" />
        <line x1="80" y1="110" x2="160" y2="110" stroke="hsl(var(--border))" strokeWidth="2" />
        <line x1="80" y1="130" x2="120" y2="130" stroke="hsl(var(--border))" strokeWidth="2" />
        <circle cx="170" cy="160" r="22" fill="hsl(var(--accent))" />
        <text x="155" y="166" fontSize="11" fontWeight="700" fill="white">SEAL</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 240 200" className="w-full h-full">
      <path d="M50 130 L100 100 L140 120 L190 95" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" />
      <circle cx="100" cy="100" r="8" fill="hsl(var(--accent))" />
      <path d="M100 100 L100 80 a8 8 0 1 1 0 -16 a8 8 0 1 1 0 16" fill="hsl(var(--accent))" />
      <path d="M70 160 c10 -10 25 -15 40 -8 c12 5 22 5 35 -2 c12 -6 25 -4 35 5" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setOnboarded } = useAuth();
  const [idx, setIdx] = useState(0);

  const slides = [
    { art: SLIDE_ART[0], title: t("onboard1") },
    { art: SLIDE_ART[1], title: t("onboard2") },
    { art: SLIDE_ART[2], title: t("onboard3") },
  ];

  const finish = () => {
    setOnboarded(true);
    navigate("/language", { replace: true });
  };

  const skip = () => finish();

  const next = () => {
    if (idx < slides.length - 1) setIdx(idx + 1);
    else finish();
  };

  return (
    <div className="min-h-[100dvh] bg-mandala">
      <div className="max-w-md mx-auto bg-background min-h-[100dvh] flex flex-col px-6 py-6">
        <div className="flex justify-end">
          <button onClick={skip} className="text-sm text-muted-foreground font-medium tap px-3 py-1.5">
            {t("skip")}
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-72 h-56 mb-8 animate-scale-in" key={idx}>
            <SlideArt id={slides[idx].art.id} />
          </div>
          <h2 className="text-2xl font-display font-bold leading-tight max-w-xs">
            {slides[idx].title}
          </h2>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === idx ? "w-6 bg-primary" : "w-1.5 bg-border"
              )}
            />
          ))}
        </div>

        <Button fullWidth onClick={next}>
          {idx === slides.length - 1 ? t("getStarted") : t("next")}
        </Button>

        <button
          onClick={() => {
            setOnboarded(true);
            navigate("/login", { replace: true });
          }}
          className="text-center text-sm text-primary mt-4 font-medium tap py-2"
        >
          {t("haveAccount")}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
