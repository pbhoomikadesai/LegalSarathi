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
    <div className="min-h-[100dvh] bg-primary bg-gradient-to-b from-primary to-[#084D3D] flex flex-col items-center justify-center px-6 text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_0%,transparent_70%)]" />
      <div className="animate-scale-in flex flex-col items-center relative z-10">
        <LegalSarathiLogo size={88} className="text-primary-foreground drop-shadow-lg" />
        <h1 className="mt-5 text-3xl font-display font-bold tracking-tight">{t("appName")}</h1>
        <p className="mt-2 text-sm opacity-80 font-medium">{t("tagline")}</p>
      </div>
      
      <div className="absolute bottom-12 left-0 right-0 flex justify-center">
        <div className="w-6 h-6 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
      </div>
    </div>
  );
};

export default Splash;
