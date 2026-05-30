import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LegalSarathiLogo } from "@/components/common/LegalSarathiLogo";

const Splash = () => {
  const navigate = useNavigate();
  const { isAuthenticated, hasOnboarded, hasChosenLanguage } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (isAuthenticated) navigate("/home", { replace: true });
      else if (!hasOnboarded) navigate("/onboarding", { replace: true });
      else if (!hasChosenLanguage) navigate("/language", { replace: true });
      else navigate("/login", { replace: true });
    }, 1500);
    return () => window.clearTimeout(id);
  }, [navigate, isAuthenticated, hasOnboarded, hasChosenLanguage]);

  return (
    <div className="min-h-[100dvh] bg-primary flex flex-col items-center justify-center px-6 text-primary-foreground">
      <div className="animate-scale-in flex flex-col items-center">
        <LegalSarathiLogo size={88} className="text-primary-foreground" />
        <h1 className="mt-5 text-3xl font-display font-bold tracking-tight">{t("appName")}</h1>
        <p className="mt-2 text-sm opacity-90">{t("tagline")}</p>
      </div>
    </div>
  );
};

export default Splash;
